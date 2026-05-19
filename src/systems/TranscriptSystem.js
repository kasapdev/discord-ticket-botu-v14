// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - HTML Transcript Sistemi
// ═══════════════════════════════════════════════════════════════

const { AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const Logger = require('../utils/Logger');

class TranscriptSystem {
  /**
   * Ticket transcript'ı oluşturur
   * @param {Object} ticket - Ticket verisi
   * @param {TextChannel} channel - Discord kanalı
   * @param {Guild} guild - Discord sunucusu
   * @returns {AttachmentBuilder|null}
   */
  async generate(ticket, channel, guild) {
    try {
      // Kanal mesajlarını çek
      const messages = await this._fetchMessages(channel);

      // HTML oluştur
      const html = this._buildHTML(ticket, messages, guild);

      // Dosyaya kaydet
      const transcriptDir = path.resolve(config.transcript.savePath);
      if (!fs.existsSync(transcriptDir)) {
        fs.mkdirSync(transcriptDir, { recursive: true });
      }

      const fileName = `transcript-${ticket.id}.html`;
      const filePath = path.join(transcriptDir, fileName);
      fs.writeFileSync(filePath, html, 'utf8');

      // Discord attachment oluştur
      const attachment = new AttachmentBuilder(filePath, { name: fileName });

      Logger.info('TranscriptSystem', `Transcript oluşturuldu: ${fileName}`);
      return attachment;

    } catch (err) {
      Logger.error('TranscriptSystem', 'Transcript oluşturma hatası', err);
      return null;
    }
  }

  /**
   * Kanal mesajlarını çeker
   */
  async _fetchMessages(channel) {
    const messages = [];
    let lastId = null;

    try {
      while (true) {
        const options = { limit: 100 };
        if (lastId) options.before = lastId;

        const batch = await channel.messages.fetch(options);
        if (batch.size === 0) break;

        messages.push(...batch.values());
        lastId = batch.last().id;

        if (batch.size < 100) break;
      }
    } catch (err) {
      Logger.warn('TranscriptSystem', `Mesaj çekme hatası: ${err.message}`);
    }

    return messages.reverse();
  }

  /**
   * HTML transcript oluşturur
   */
  _buildHTML(ticket, messages, guild) {
    const categoryConfig = config.ticket.categories.find(c => c.id === ticket.category);
    const createdAt = new Date(ticket.created_at * 1000).toLocaleString('tr-TR');
    const closedAt = ticket.closed_at ? new Date(ticket.closed_at * 1000).toLocaleString('tr-TR') : 'Açık';

    const messagesHTML = messages.map(msg => this._buildMessageHTML(msg)).join('\n');

    return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Transcript — ${ticket.id}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background: #313338;
      color: #dcddde;
      min-height: 100vh;
    }
    .header {
      background: linear-gradient(135deg, #5865F2 0%, #4752C4 100%);
      padding: 24px 32px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    }
    .header-icon {
      font-size: 40px;
    }
    .header-info h1 {
      font-size: 22px;
      font-weight: 700;
      color: #fff;
    }
    .header-info p {
      font-size: 13px;
      color: rgba(255,255,255,0.7);
      margin-top: 2px;
    }
    .ticket-info {
      background: #2b2d31;
      padding: 16px 32px;
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      border-bottom: 1px solid #1e1f22;
    }
    .ticket-info-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .ticket-info-item .label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #949ba4;
      letter-spacing: 0.5px;
    }
    .ticket-info-item .value {
      font-size: 14px;
      color: #e0e1e5;
      font-weight: 500;
    }
    .messages-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 24px 16px;
    }
    .message {
      display: flex;
      gap: 16px;
      padding: 4px 0;
      margin-bottom: 2px;
      border-radius: 4px;
      transition: background 0.1s;
    }
    .message:hover {
      background: rgba(255,255,255,0.03);
    }
    .message.grouped {
      padding-left: 56px;
    }
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      flex-shrink: 0;
      object-fit: cover;
    }
    .avatar-placeholder {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #5865F2;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
    }
    .message-content {
      flex: 1;
      min-width: 0;
    }
    .message-header {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 2px;
    }
    .username {
      font-size: 15px;
      font-weight: 600;
      color: #e0e1e5;
    }
    .username.bot {
      color: #5865F2;
    }
    .bot-badge {
      background: #5865F2;
      color: white;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 4px;
      border-radius: 3px;
      text-transform: uppercase;
    }
    .timestamp {
      font-size: 11px;
      color: #949ba4;
    }
    .message-text {
      font-size: 15px;
      line-height: 1.375;
      color: #dcddde;
      word-wrap: break-word;
    }
    .message-text a {
      color: #00b0f4;
      text-decoration: none;
    }
    .message-text a:hover {
      text-decoration: underline;
    }
    .embed {
      border-left: 4px solid #5865F2;
      background: #2b2d31;
      border-radius: 0 4px 4px 0;
      padding: 12px 16px;
      margin-top: 4px;
      max-width: 520px;
    }
    .embed-title {
      font-size: 15px;
      font-weight: 700;
      color: #e0e1e5;
      margin-bottom: 6px;
    }
    .embed-description {
      font-size: 14px;
      color: #dcddde;
      line-height: 1.4;
    }
    .attachment {
      margin-top: 4px;
    }
    .attachment img {
      max-width: 400px;
      max-height: 300px;
      border-radius: 4px;
    }
    .attachment a {
      color: #00b0f4;
      font-size: 14px;
    }
    .footer {
      background: #2b2d31;
      padding: 16px 32px;
      text-align: center;
      font-size: 12px;
      color: #949ba4;
      border-top: 1px solid #1e1f22;
      margin-top: 32px;
    }
    .stats-bar {
      background: #2b2d31;
      padding: 12px 32px;
      display: flex;
      gap: 24px;
      font-size: 13px;
      color: #949ba4;
      border-bottom: 1px solid #1e1f22;
    }
    .stats-bar span strong {
      color: #e0e1e5;
    }
    .system-message {
      text-align: center;
      font-size: 12px;
      color: #949ba4;
      padding: 8px 0;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-icon">🎫</div>
    <div class="header-info">
      <h1>Ticket Transcript</h1>
      <p>${guild.name} — ${categoryConfig?.label || ticket.category}</p>
    </div>
  </div>

  <div class="ticket-info">
    <div class="ticket-info-item">
      <span class="label">Ticket ID</span>
      <span class="value">${ticket.id}</span>
    </div>
    <div class="ticket-info-item">
      <span class="label">Kullanıcı</span>
      <span class="value">${ticket.user_id}</span>
    </div>
    <div class="ticket-info-item">
      <span class="label">Kategori</span>
      <span class="value">${categoryConfig?.emoji || ''} ${categoryConfig?.label || ticket.category}</span>
    </div>
    <div class="ticket-info-item">
      <span class="label">Öncelik</span>
      <span class="value">${ticket.priority || 'medium'}</span>
    </div>
    <div class="ticket-info-item">
      <span class="label">Oluşturulma</span>
      <span class="value">${createdAt}</span>
    </div>
    <div class="ticket-info-item">
      <span class="label">Kapatılma</span>
      <span class="value">${closedAt}</span>
    </div>
    ${ticket.claimed_by ? `
    <div class="ticket-info-item">
      <span class="label">Üstlenen</span>
      <span class="value">${ticket.claimed_by}</span>
    </div>` : ''}
    ${ticket.rating ? `
    <div class="ticket-info-item">
      <span class="label">Puan</span>
      <span class="value">${'⭐'.repeat(ticket.rating)} (${ticket.rating}/5)</span>
    </div>` : ''}
  </div>

  <div class="stats-bar">
    <span>💬 <strong>${messages.length}</strong> mesaj</span>
    <span>👥 <strong>${new Set(messages.map(m => m.author.id)).size}</strong> katılımcı</span>
    <span>📅 Oluşturuldu: <strong>${createdAt}</strong></span>
  </div>

  <div class="messages-container">
    ${messagesHTML || '<p class="system-message">Bu ticket\'ta mesaj bulunmuyor.</p>'}
  </div>

  <div class="footer">
    <p>Bu transcript <strong>${config.bot.name} v${config.bot.version}</strong> için <strong>kasapac</strong> tarafından oluşturuldu.</p>
    <p style="margin-top:4px;">Ticket ID: ${ticket.id} • ${new Date().toLocaleString('tr-TR')}</p>
  </div>
</body>
</html>`;
  }

  /**
   * Tek mesaj HTML'i oluşturur
   */
  _buildMessageHTML(message) {
    const timestamp = message.createdAt.toLocaleString('tr-TR');
    const isBot = message.author.bot;
    const avatarUrl = message.author.displayAvatarURL({ size: 64, extension: 'png' });

    const contentHTML = this._escapeHTML(message.content || '');
    const formattedContent = this._formatDiscordMarkdown(contentHTML);

    const embedsHTML = message.embeds.map(embed => `
      <div class="embed" style="border-left-color: ${embed.color ? '#' + embed.color.toString(16).padStart(6, '0') : '#5865F2'}">
        ${embed.title ? `<div class="embed-title">${this._escapeHTML(embed.title)}</div>` : ''}
        ${embed.description ? `<div class="embed-description">${this._formatDiscordMarkdown(this._escapeHTML(embed.description))}</div>` : ''}
      </div>
    `).join('');

    const attachmentsHTML = message.attachments.map(att => {
      if (att.contentType?.startsWith('image/')) {
        return `<div class="attachment"><img src="${att.url}" alt="${att.name}" loading="lazy"></div>`;
      }
      return `<div class="attachment"><a href="${att.url}" target="_blank">📎 ${att.name}</a></div>`;
    }).join('');

    return `
    <div class="message">
      <img class="avatar" src="${avatarUrl}" alt="${this._escapeHTML(message.author.username)}" onerror="this.style.display='none'">
      <div class="message-content">
        <div class="message-header">
          <span class="username ${isBot ? 'bot' : ''}">${this._escapeHTML(message.author.username)}</span>
          ${isBot ? '<span class="bot-badge">BOT</span>' : ''}
          <span class="timestamp">${timestamp}</span>
        </div>
        ${formattedContent ? `<div class="message-text">${formattedContent}</div>` : ''}
        ${embedsHTML}
        ${attachmentsHTML}
      </div>
    </div>`;
  }

  /**
   * HTML escape
   */
  _escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Discord markdown'ı HTML'e çevirir
   */
  _formatDiscordMarkdown(str) {
    if (!str) return '';
    return str
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/__(.+?)__/g, '<u>$1</u>')
      .replace(/~~(.+?)~~/g, '<s>$1</s>')
      .replace(/`(.+?)`/g, '<code style="background:#1e1f22;padding:2px 4px;border-radius:3px;font-family:monospace">$1</code>')
      .replace(/\n/g, '<br>')
      .replace(/https?:\/\/[^\s<]+/g, url => `<a href="${url}" target="_blank">${url}</a>`);
  }
}

module.exports = new TranscriptSystem();