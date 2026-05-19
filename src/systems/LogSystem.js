// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - Gelişmiş Log Sistemi
// ═══════════════════════════════════════════════════════════════

const { EmbedBuilder } = require('discord.js');
const db = require('../database/Database');
const config = require('../config/config');
const Logger = require('../utils/Logger');

class LogSystem {
  /**
   * Log kanalına klasik embed gönderir
   */
  async send(guild, channelKey, embed) {
    try {
      const settings = db.getGuildSettings(guild.id);
      if (!settings) return;

      const channelId = settings[channelKey];
      if (!channelId) return;

      const channel = guild.channels.cache.get(channelId);
      if (!channel) return;

      await channel.send({ embeds: [embed] });
    } catch (err) {
      Logger.error('LogSystem', `Log gönderilemedi (${channelKey}): ${err.message}`);
    }
  }

  /**
   * Log kanalına Components V2 mesaj gönderir
   */
  async sendV2(guild, channelKey, msgOptions) {
    try {
      const settings = db.getGuildSettings(guild.id);
      if (!settings) return;

      const channelId = settings[channelKey];
      if (!channelId) return;

      const channel = guild.channels.cache.get(channelId);
      if (!channel) return;

      await channel.send(msgOptions);
    } catch (err) {
      Logger.error('LogSystem', `V2 Log gönderilemedi (${channelKey}): ${err.message}`);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // TICKET LOGS
  // ══════════════════════════════════════════════════════════════

  async ticketLog(guild, action, ticketOrData, user, category = null, extra = {}) {
    const settings = db.getGuildSettings(guild.id) || {};
    const footer = settings.panel_footer || `${config.bot.name} | Log Sistemi`;

    const Embed = require('../layouts/EmbedBuilder');

    // panel_sent / panel_edit gibi ticket olmayan aksiyonlar
    if (action === 'panel_sent' || action === 'panel_edit') {
      const data = ticketOrData || {};
      const msgOptions = Embed.ticketLogMessage(action === 'panel_sent' ? 'panel_sent' : 'panel_edit', {
        channel: data.channel,
        executor: data.executor,
        guildId: guild.id,
        catCount: data.catCount,
        panelMsg: data.panelMsg,
        footer,
      });
      return await this.sendV2(guild, 'ticket_log_channel', msgOptions);
    }

    const ticket = ticketOrData;
    const ticketChannel = ticket?.channel_id ? guild.channels.cache.get(ticket.channel_id) : null;
    const ticketNum = ticket?.id ? `#${String(ticket.id).padStart(3, '0')}` : '#???';
    const catLabel = category?.label || ticket?.category || 'Genel';
    const catEmoji = category?.emoji || '';

    // action -> ticketLogMessage type mapping
    const typeMap = {
      create: 'ticket_open',
      close:  'ticket_close',
      claim:  'ticket_claim',
      delete: 'ticket_close',
      reopen: 'ticket_open',
    };

    const msgOptions = Embed.ticketLogMessage(typeMap[action] || action, {
      ticketId: ticketNum,
      channel: ticketChannel,
      user: user ? `${user}` : null,
      closer: extra.closedBy ? `${extra.closedBy}` : null,
      claimer: extra.claimer ? `${extra.claimer}` : null,
      guildId: guild.id,
      category: action === 'create' ? catLabel : null,
      categoryEmoji: catEmoji,
      footer,
    });

    await this.sendV2(guild, 'ticket_log_channel', msgOptions);
  }

  // ══════════════════════════════════════════════════════════════
  // MODERATION LOGS
  // ══════════════════════════════════════════════════════════════

  async modLog(guild, action, target, moderator, reason, extra = {}) {
    const actions = {
      ban:     { color: config.colors.error,   emoji: '🔨', title: 'Kullanıcı Banlandı' },
      unban:   { color: config.colors.success, emoji: '✅', title: 'Ban Kaldırıldı' },
      kick:    { color: config.colors.warning, emoji: '👢', title: 'Kullanıcı Atıldı' },
      mute:    { color: config.colors.warning, emoji: '🔇', title: 'Kullanıcı Susturuldu' },
      unmute:  { color: config.colors.success, emoji: '🔊', title: 'Susturma Kaldırıldı' },
      warn:    { color: config.colors.warning, emoji: '⚠️', title: 'Kullanıcı Uyarıldı' },
      jail:    { color: config.colors.mod,     emoji: '🔒', title: 'Kullanıcı Hapsedildi' },
      unjail:  { color: config.colors.success, emoji: '🔓', title: 'Hapisten Çıkarıldı' },
      clear:   { color: config.colors.info,    emoji: '🗑️', title: 'Mesajlar Temizlendi' },
      lock:    { color: config.colors.warning, emoji: '🔒', title: 'Kanal Kilitlendi' },
      unlock:  { color: config.colors.success, emoji: '🔓', title: 'Kanal Kilidi Açıldı' },
      slowmode:{ color: config.colors.info,    emoji: '⏱️', title: 'Yavaş Mod Ayarlandı' },
      nickname:{ color: config.colors.info,    emoji: '✏️', title: 'Takma Ad Değiştirildi' },
    };

    const actionData = actions[action] || { color: config.colors.log, emoji: '📋', title: action };

    const embed = new EmbedBuilder()
      .setColor(actionData.color)
      .setTitle(`${actionData.emoji} ${actionData.title}`)
      .addFields(
        { name: '👤 Hedef', value: `${target.tag || target} (${target.id || target})`, inline: true },
        { name: '🛡️ Moderatör', value: `${moderator.tag || moderator} (${moderator.id || moderator})`, inline: true },
        { name: '📝 Sebep', value: reason || 'Belirtilmedi', inline: false },
      )
      .setTimestamp();

    if (target.displayAvatarURL) {
      embed.setThumbnail(target.displayAvatarURL({ dynamic: true }));
    }

    if (extra.duration) embed.addFields({ name: '⏰ Süre', value: extra.duration, inline: true });
    if (extra.expires) embed.addFields({ name: '⏰ Bitiş', value: `<t:${extra.expires}:R>`, inline: true });
    if (extra.caseId) embed.addFields({ name: '📋 Vaka #', value: `${extra.caseId}`, inline: true });
    if (extra.amount) embed.addFields({ name: '🗑️ Miktar', value: `${extra.amount} mesaj`, inline: true });
    if (extra.channel) embed.addFields({ name: '📢 Kanal', value: `${extra.channel}`, inline: true });

    embed.setFooter({ text: `Kullanıcı ID: ${target.id || target}` });

    await this.send(guild, 'mod_log_channel', embed);
  }

  // ══════════════════════════════════════════════════════════════
  // GUARD LOGS
  // ══════════════════════════════════════════════════════════════

  async guardLog(guild, action, executor, details, punishment) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.guard)
      .setTitle(`🛡️ GUARD UYARISI — ${action.toUpperCase()}`)
      .setDescription(`**⚠️ Şüpheli aktivite tespit edildi!**\n\n${details}`)
      .addFields(
        { name: '👤 Kullanıcı', value: `${executor.tag || executor} (${executor.id || executor})`, inline: true },
        { name: '⚡ Ceza', value: punishment || 'Yok', inline: true },
        { name: '⏰ Zaman', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
      )
      .setTimestamp();

    if (executor.displayAvatarURL) {
      embed.setThumbnail(executor.displayAvatarURL({ dynamic: true }));
    }

    embed.setFooter({ text: 'MeteTicket Guard Sistemi' });

    await this.send(guild, 'guard_log_channel', embed);
  }

  // ══════════════════════════════════════════════════════════════
  // MESSAGE LOGS
  // ══════════════════════════════════════════════════════════════

  async messageDeleteLog(guild, message) {
    if (!config.logs.messageDelete) return;
    if (message.author?.bot) return;

    const embed = new EmbedBuilder()
      .setColor(config.colors.error)
      .setTitle('🗑️ Mesaj Silindi')
      .addFields(
        { name: '👤 Kullanıcı', value: `${message.author?.tag || 'Bilinmiyor'} (${message.author?.id || 'Bilinmiyor'})`, inline: true },
        { name: '📢 Kanal', value: `${message.channel}`, inline: true },
        { name: '📝 İçerik', value: message.content ? (message.content.length > 1000 ? message.content.slice(0, 1000) + '...' : message.content) : '*Yok*', inline: false },
      )
      .setTimestamp();

    if (message.author?.displayAvatarURL) {
      embed.setThumbnail(message.author.displayAvatarURL({ dynamic: true }));
    }

    await this.send(guild, 'log_channel', embed);
  }

  async messageEditLog(guild, oldMessage, newMessage) {
    if (!config.logs.messageEdit) return;
    if (newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle('✏️ Mesaj Düzenlendi')
      .addFields(
        { name: '👤 Kullanıcı', value: `${newMessage.author?.tag || 'Bilinmiyor'} (${newMessage.author?.id || 'Bilinmiyor'})`, inline: true },
        { name: '📢 Kanal', value: `${newMessage.channel}`, inline: true },
        { name: '📝 Eski İçerik', value: oldMessage.content ? (oldMessage.content.length > 500 ? oldMessage.content.slice(0, 500) + '...' : oldMessage.content) : '*Yok*', inline: false },
        { name: '📝 Yeni İçerik', value: newMessage.content ? (newMessage.content.length > 500 ? newMessage.content.slice(0, 500) + '...' : newMessage.content) : '*Yok*', inline: false },
      )
      .setURL(newMessage.url)
      .setTimestamp();

    await this.send(guild, 'log_channel', embed);
  }

  // ══════════════════════════════════════════════════════════════
  // MEMBER LOGS
  // ══════════════════════════════════════════════════════════════

  async memberJoinLog(guild, member) {
    if (!config.logs.memberJoin) return;

    const accountAge = Math.floor((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24));
    const isNew = accountAge < 7;

    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('📥 Üye Katıldı')
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '👤 Kullanıcı', value: `${member.user.tag} (${member.user.id})`, inline: true },
        { name: '📅 Hesap Yaşı', value: `${accountAge} gün${isNew ? ' ⚠️ Yeni Hesap' : ''}`, inline: true },
        { name: '👥 Üye Sayısı', value: `${guild.memberCount}`, inline: true },
        { name: '📅 Hesap Oluşturma', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`, inline: false },
      )
      .setTimestamp();

    await this.send(guild, 'log_channel', embed);
  }

  async memberLeaveLog(guild, member) {
    if (!config.logs.memberLeave) return;

    const roles = member.roles.cache
      .filter(r => r.id !== guild.id)
      .map(r => r.name)
      .join(', ') || 'Yok';

    const embed = new EmbedBuilder()
      .setColor(config.colors.error)
      .setTitle('📤 Üye Ayrıldı')
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '👤 Kullanıcı', value: `${member.user.tag} (${member.user.id})`, inline: true },
        { name: '📅 Katılma', value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Bilinmiyor', inline: true },
        { name: '👥 Üye Sayısı', value: `${guild.memberCount}`, inline: true },
        { name: '🎭 Roller', value: roles.length > 200 ? roles.slice(0, 200) + '...' : roles, inline: false },
      )
      .setTimestamp();

    await this.send(guild, 'log_channel', embed);
  }

  // ══════════════════════════════════════════════════════════════
  // ROLE LOGS
  // ══════════════════════════════════════════════════════════════

  async roleCreateLog(guild, role) {
    if (!config.logs.roleCreate) return;

    const embed = new EmbedBuilder()
      .setColor(role.color || config.colors.success)
      .setTitle('🎭 Rol Oluşturuldu')
      .addFields(
        { name: '🎭 Rol', value: `${role} (${role.id})`, inline: true },
        { name: '🎨 Renk', value: role.hexColor, inline: true },
        { name: '📌 Konum', value: `${role.position}`, inline: true },
      )
      .setTimestamp();

    await this.send(guild, 'log_channel', embed);
  }

  async roleDeleteLog(guild, role) {
    if (!config.logs.roleDelete) return;

    const embed = new EmbedBuilder()
      .setColor(config.colors.error)
      .setTitle('🗑️ Rol Silindi')
      .addFields(
        { name: '🎭 Rol Adı', value: role.name, inline: true },
        { name: '🆔 ID', value: role.id, inline: true },
        { name: '🎨 Renk', value: role.hexColor, inline: true },
      )
      .setTimestamp();

    await this.send(guild, 'log_channel', embed);
  }

  // ══════════════════════════════════════════════════════════════
  // CHANNEL LOGS
  // ══════════════════════════════════════════════════════════════

  async channelCreateLog(guild, channel) {
    if (!config.logs.channelCreate) return;

    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('📢 Kanal Oluşturuldu')
      .addFields(
        { name: '📢 Kanal', value: `${channel} (${channel.id})`, inline: true },
        { name: '📂 Tür', value: channel.type.toString(), inline: true },
      )
      .setTimestamp();

    await this.send(guild, 'log_channel', embed);
  }

  async channelDeleteLog(guild, channel) {
    if (!config.logs.channelDelete) return;

    const embed = new EmbedBuilder()
      .setColor(config.colors.error)
      .setTitle('🗑️ Kanal Silindi')
      .addFields(
        { name: '📢 Kanal Adı', value: channel.name, inline: true },
        { name: '🆔 ID', value: channel.id, inline: true },
        { name: '📂 Tür', value: channel.type.toString(), inline: true },
      )
      .setTimestamp();

    await this.send(guild, 'log_channel', embed);
  }

  // ══════════════════════════════════════════════════════════════
  // VOICE LOGS
  // ══════════════════════════════════════════════════════════════

  async voiceLog(guild, oldState, newState) {
    if (!config.logs.voiceStateUpdate) return;

    const member = newState.member;
    let action, color, emoji;

    if (!oldState.channel && newState.channel) {
      action = `**${newState.channel.name}** kanalına katıldı`;
      color = config.colors.success;
      emoji = '🔊';
    } else if (oldState.channel && !newState.channel) {
      action = `**${oldState.channel.name}** kanalından ayrıldı`;
      color = config.colors.error;
      emoji = '🔇';
    } else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
      action = `**${oldState.channel.name}** → **${newState.channel.name}**`;
      color = config.colors.warning;
      emoji = '🔄';
    } else {
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`${emoji} Ses Kanalı`)
      .addFields(
        { name: '👤 Kullanıcı', value: `${member.user.tag} (${member.user.id})`, inline: true },
        { name: '📢 İşlem', value: action, inline: true },
      )
      .setTimestamp();

    await this.send(guild, 'log_channel', embed);
  }
}

module.exports = new LogSystem();