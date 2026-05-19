// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - Message Create Event (Anti-Spam + Auto Responder)
// ═══════════════════════════════════════════════════════════════

const { PermissionFlagsBits } = require('discord.js');
const config = require('../config/config');
const db = require('../database/Database');
const Logger = require('../utils/Logger');
const LogSystem = require('../systems/LogSystem');

// Anti-spam tracker: userId -> [timestamps]
const spamTracker = new Map();

module.exports = {
  name: 'messageCreate',
  once: false,

  async execute(client, message) {
    // Bot mesajlarını yoksay
    if (message.author.bot) return;
    if (!message.guild) return;

    try {
      // Ticket mesaj sayacını güncelle
      const ticket = db.getTicketByChannel(message.channelId);
      if (ticket && ticket.status === 'open') {
        db.updateTicketActivity(ticket.id);
        db.updateStaffPerformance(message.guild.id, message.author.id, 'total_messages');
      }

      // Anti-spam kontrolü
      const settings = db.getGuildSettings(message.guild.id);
      if (settings?.anti_spam_enabled !== 0 && config.antiSpam.enabled) {
        await _checkAntiSpam(message, settings);
      }

      // Auto responder kontrolü
      await _checkAutoResponder(message, settings);

    } catch (err) {
      Logger.error('MessageCreate', `Hata: ${err.message}`);
    }
  },
};

/**
 * Anti-spam kontrolü
 */
async function _checkAntiSpam(message, settings) {
  // Admin ve staff'ı atla
  if (message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
  if (settings?.staff_role && message.member.roles.cache.has(settings.staff_role)) return;

  const userId = message.author.id;
  const now = Date.now();

  if (!spamTracker.has(userId)) {
    spamTracker.set(userId, []);
  }

  const timestamps = spamTracker.get(userId);
  const windowMs = config.antiSpam.timeWindow;

  // Eski kayıtları temizle
  const filtered = timestamps.filter(t => now - t < windowMs);
  filtered.push(now);
  spamTracker.set(userId, filtered);

  // Threshold kontrolü
  if (filtered.length >= config.antiSpam.maxMessages) {
    spamTracker.delete(userId);

    try {
      // Timeout uygula
      const durationMs = require('ms')(config.antiSpam.muteDuration);
      await message.member.timeout(durationMs, 'Anti-spam: Çok fazla mesaj');

      // Uyarı mesajı gönder
      const Embed = require('../layouts/EmbedBuilder');
      const msg = await message.channel.send({
        embeds: [Embed.warning('Anti-Spam', `${message.author} çok hızlı mesaj gönderdiği için **${config.antiSpam.muteDuration}** susturuldu.`)],
      });

      // 5 saniye sonra uyarıyı sil
      setTimeout(() => msg.delete().catch(() => {}), 5000);

      Logger.warn('AntiSpam', `Spam tespit edildi: ${message.author.tag} (${message.guild.name})`);
    } catch (err) {
      Logger.error('AntiSpam', `Timeout uygulanamadı: ${err.message}`);
    }
  }
}

/**
 * Auto responder kontrolü
 */
async function _checkAutoResponder(message, settings) {
  const responders = db.getAutoResponders(message.guild.id);
  if (!responders || responders.length === 0) return;

  const content = message.content.toLowerCase();

  for (const responder of responders) {
    let matched = false;
    const trigger = responder.trigger.toLowerCase();

    switch (responder.match_type) {
      case 'exact':
        matched = content === trigger;
        break;
      case 'contains':
        matched = content.includes(trigger);
        break;
      case 'startsWith':
        matched = content.startsWith(trigger);
        break;
      case 'endsWith':
        matched = content.endsWith(trigger);
        break;
      case 'regex':
        try {
          matched = new RegExp(responder.trigger, 'i').test(message.content);
        } catch (_) {}
        break;
    }

    if (matched) {
      try {
        await message.reply({ content: responder.response });
      } catch (err) {
        Logger.error('AutoResponder', `Yanıt gönderilemedi: ${err.message}`);
      }
      break; // İlk eşleşmede dur
    }
  }
}