// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - Sunucu Koruma (Guard) Sistemi
// ═══════════════════════════════════════════════════════════════

const { PermissionFlagsBits, AuditLogEvent } = require('discord.js');
const db = require('../database/Database');
const config = require('../config/config');
const Logger = require('../utils/Logger');
const LogSystem = require('./LogSystem');

class GuardSystem {
  constructor() {
    // Guild bazlı action tracker: { guildId: { action: [{ userId, timestamp }] } }
    this.actionTracker = new Map();
  }

  /**
   * Guard aktif mi kontrol eder
   */
  isEnabled(guildId) {
    const settings = db.getGuildSettings(guildId);
    return settings?.guard_enabled !== 0 && config.guard.enabled;
  }

  /**
   * Kullanıcı whitelist'te mi kontrol eder
   */
  isWhitelisted(guildId, userId) {
    return db.isGuardWhitelisted(guildId, userId);
  }

  /**
   * Action tracker'a ekler ve threshold kontrolü yapar
   * @returns {boolean} threshold aşıldıysa true
   */
  trackAction(guildId, userId, action) {
    const key = `${guildId}`;
    if (!this.actionTracker.has(key)) {
      this.actionTracker.set(key, {});
    }

    const guildTracker = this.actionTracker.get(key);
    if (!guildTracker[action]) {
      guildTracker[action] = [];
    }

    const now = Date.now();
    const windowMs = config.guard.timeWindow * 1000;

    // Eski kayıtları temizle
    guildTracker[action] = guildTracker[action].filter(
      entry => entry.userId === userId && now - entry.timestamp < windowMs
    );

    // Yeni kaydı ekle
    guildTracker[action].push({ userId, timestamp: now });

    // Threshold kontrolü
    const userActions = guildTracker[action].filter(e => e.userId === userId);
    const threshold = config.guard.thresholds[action] || 5;

    return userActions.length >= threshold;
  }

  /**
   * Kullanıcıya ceza uygular
   */
  async punish(guild, userId, reason) {
    try {
      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member) return;

      // Bot veya sunucu sahibini cezalandırma
      if (member.user.bot || member.id === guild.ownerId) return;

      const punishment = config.guard.punishment;

      if (punishment === 'ban') {
        await guild.members.ban(userId, { reason: `[GUARD] ${reason}`, deleteMessageSeconds: 0 });
        Logger.guard('GuardSystem', `Ban uygulandı: ${userId} — ${reason}`);
      } else if (punishment === 'kick') {
        await member.kick(`[GUARD] ${reason}`);
        Logger.guard('GuardSystem', `Kick uygulandı: ${userId} — ${reason}`);
      } else if (punishment === 'removeRoles') {
        const roles = member.roles.cache.filter(r => r.id !== guild.id && r.managed === false);
        await member.roles.remove(roles, `[GUARD] ${reason}`);
        Logger.guard('GuardSystem', `Roller alındı: ${userId} — ${reason}`);
      }

      // Guard log kaydet
      db.addGuardLog(guild.id, userId, reason, reason, punishment);

      return punishment;
    } catch (err) {
      Logger.error('GuardSystem', `Ceza uygulanamadı: ${userId}`, err);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // KANAL SİLME KORUMASI
  // ══════════════════════════════════════════════════════════════

  async onChannelDelete(guild, channel) {
    if (!this.isEnabled(guild.id)) return;

    try {
      const auditLog = await guild.fetchAuditLogs({
        type: AuditLogEvent.ChannelDelete,
        limit: 1,
      });

      const entry = auditLog.entries.first();
      if (!entry) return;

      const executor = entry.executor;
      if (!executor || executor.id === guild.client.user.id) return;
      if (this.isWhitelisted(guild.id, executor.id)) return;
      if (executor.id === guild.ownerId) return;

      const exceeded = this.trackAction(guild.id, executor.id, 'channelDelete');
      if (!exceeded) return;

      Logger.guard('GuardSystem', `Kanal silme saldırısı tespit edildi: ${executor.tag} (${guild.name})`);

      const punishment = await this.punish(guild, executor.id, `Toplu kanal silme (${config.guard.thresholds.channelDelete} kanal/${config.guard.timeWindow}s)`);

      // Rollback: Kanalı geri yükle
      if (config.guard.rollback) {
        try {
          await guild.channels.create({
            name: channel.name,
            type: channel.type,
            parent: channel.parentId,
            topic: channel.topic,
            nsfw: channel.nsfw,
            rateLimitPerUser: channel.rateLimitPerUser,
            permissionOverwrites: channel.permissionOverwrites.cache.toJSON(),
          });
          Logger.guard('GuardSystem', `Kanal geri yüklendi: ${channel.name}`);
        } catch (err) {
          Logger.error('GuardSystem', `Kanal geri yükleme hatası: ${err.message}`);
        }
      }

      await LogSystem.guardLog(
        guild,
        'KANAL_SİLME',
        executor,
        `**${executor.tag}** toplu kanal silme gerçekleştirdi.\n**Silinen Kanal:** ${channel.name}`,
        punishment
      );

    } catch (err) {
      Logger.error('GuardSystem', `onChannelDelete hatası: ${err.message}`);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // ROL SİLME KORUMASI
  // ══════════════════════════════════════════════════════════════

  async onRoleDelete(guild, role) {
    if (!this.isEnabled(guild.id)) return;

    try {
      const auditLog = await guild.fetchAuditLogs({
        type: AuditLogEvent.RoleDelete,
        limit: 1,
      });

      const entry = auditLog.entries.first();
      if (!entry) return;

      const executor = entry.executor;
      if (!executor || executor.id === guild.client.user.id) return;
      if (this.isWhitelisted(guild.id, executor.id)) return;
      if (executor.id === guild.ownerId) return;

      const exceeded = this.trackAction(guild.id, executor.id, 'roleDelete');
      if (!exceeded) return;

      Logger.guard('GuardSystem', `Rol silme saldırısı tespit edildi: ${executor.tag}`);

      const punishment = await this.punish(guild, executor.id, `Toplu rol silme (${config.guard.thresholds.roleDelete} rol/${config.guard.timeWindow}s)`);

      // Rollback: Rolü geri yükle
      if (config.guard.rollback) {
        try {
          await guild.roles.create({
            name: role.name,
            color: role.color,
            hoist: role.hoist,
            permissions: role.permissions,
            mentionable: role.mentionable,
            position: role.position,
          });
          Logger.guard('GuardSystem', `Rol geri yüklendi: ${role.name}`);
        } catch (err) {
          Logger.error('GuardSystem', `Rol geri yükleme hatası: ${err.message}`);
        }
      }

      await LogSystem.guardLog(
        guild,
        'ROL_SİLME',
        executor,
        `**${executor.tag}** toplu rol silme gerçekleştirdi.\n**Silinen Rol:** ${role.name}`,
        punishment
      );

    } catch (err) {
      Logger.error('GuardSystem', `onRoleDelete hatası: ${err.message}`);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // TOPLU BAN KORUMASI
  // ══════════════════════════════════════════════════════════════

  async onMemberBan(guild, user) {
    if (!this.isEnabled(guild.id)) return;

    try {
      const auditLog = await guild.fetchAuditLogs({
        type: AuditLogEvent.MemberBan,
        limit: 1,
      });

      const entry = auditLog.entries.first();
      if (!entry) return;

      const executor = entry.executor;
      if (!executor || executor.id === guild.client.user.id) return;
      if (this.isWhitelisted(guild.id, executor.id)) return;
      if (executor.id === guild.ownerId) return;

      const exceeded = this.trackAction(guild.id, executor.id, 'memberBan');
      if (!exceeded) return;

      Logger.guard('GuardSystem', `Toplu ban saldırısı tespit edildi: ${executor.tag}`);

      const punishment = await this.punish(guild, executor.id, `Toplu ban (${config.guard.thresholds.memberBan} ban/${config.guard.timeWindow}s)`);

      await LogSystem.guardLog(
        guild,
        'TOPLU_BAN',
        executor,
        `**${executor.tag}** toplu ban gerçekleştirdi.\n**Banlanan:** ${user.tag}`,
        punishment
      );

    } catch (err) {
      Logger.error('GuardSystem', `onMemberBan hatası: ${err.message}`);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // WEBHOOK KORUMASI
  // ══════════════════════════════════════════════════════════════

  async onWebhookCreate(guild, channel) {
    if (!this.isEnabled(guild.id)) return;

    try {
      const auditLog = await guild.fetchAuditLogs({
        type: AuditLogEvent.WebhookCreate,
        limit: 1,
      });

      const entry = auditLog.entries.first();
      if (!entry) return;

      const executor = entry.executor;
      if (!executor || executor.id === guild.client.user.id) return;
      if (this.isWhitelisted(guild.id, executor.id)) return;
      if (executor.id === guild.ownerId) return;

      const exceeded = this.trackAction(guild.id, executor.id, 'webhookCreate');
      if (!exceeded) return;

      Logger.guard('GuardSystem', `Webhook saldırısı tespit edildi: ${executor.tag}`);

      // Webhook'u sil
      try {
        const webhooks = await channel.fetchWebhooks();
        for (const webhook of webhooks.values()) {
          if (webhook.owner?.id === executor.id) {
            await webhook.delete('[GUARD] Şüpheli webhook');
          }
        }
      } catch (_) {}

      const punishment = await this.punish(guild, executor.id, `Toplu webhook oluşturma`);

      await LogSystem.guardLog(
        guild,
        'WEBHOOK_OLUŞTURMA',
        executor,
        `**${executor.tag}** şüpheli webhook oluşturdu.`,
        punishment
      );

    } catch (err) {
      Logger.error('GuardSystem', `onWebhookCreate hatası: ${err.message}`);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // SUNUCU AYARI DEĞİŞİKLİĞİ KORUMASI
  // ══════════════════════════════════════════════════════════════

  async onGuildUpdate(oldGuild, newGuild) {
    if (!this.isEnabled(newGuild.id)) return;

    try {
      const auditLog = await newGuild.fetchAuditLogs({
        type: AuditLogEvent.GuildUpdate,
        limit: 1,
      });

      const entry = auditLog.entries.first();
      if (!entry) return;

      const executor = entry.executor;
      if (!executor || executor.id === newGuild.client.user.id) return;
      if (this.isWhitelisted(newGuild.id, executor.id)) return;
      if (executor.id === newGuild.ownerId) return;

      // Kritik değişiklikler
      const changes = [];
      if (oldGuild.name !== newGuild.name) changes.push(`Ad: ${oldGuild.name} → ${newGuild.name}`);
      if (oldGuild.verificationLevel !== newGuild.verificationLevel) changes.push(`Doğrulama seviyesi değişti`);
      if (oldGuild.mfaLevel !== newGuild.mfaLevel) changes.push(`2FA seviyesi değişti`);

      if (changes.length === 0) return;

      Logger.guard('GuardSystem', `Sunucu ayarı değişikliği: ${executor.tag} — ${changes.join(', ')}`);

      await LogSystem.guardLog(
        newGuild,
        'SUNUCU_AYARI',
        executor,
        `**${executor.tag}** sunucu ayarlarını değiştirdi.\n**Değişiklikler:**\n${changes.map(c => `• ${c}`).join('\n')}`,
        'Uyarı'
      );

    } catch (err) {
      Logger.error('GuardSystem', `onGuildUpdate hatası: ${err.message}`);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // BOT EKLEME KORUMASI
  // ══════════════════════════════════════════════════════════════

  async onBotAdd(guild, member) {
    if (!this.isEnabled(guild.id)) return;
    if (!member.user.bot) return;

    try {
      const auditLog = await guild.fetchAuditLogs({
        type: AuditLogEvent.BotAdd,
        limit: 1,
      });

      const entry = auditLog.entries.first();
      if (!entry) return;

      const executor = entry.executor;
      if (!executor) return;
      if (this.isWhitelisted(guild.id, executor.id)) return;
      if (executor.id === guild.ownerId) return;

      Logger.guard('GuardSystem', `Bot eklendi: ${member.user.tag} — Ekleyen: ${executor.tag}`);

      await LogSystem.guardLog(
        guild,
        'BOT_EKLEME',
        executor,
        `**${executor.tag}** sunucuya bot ekledi.\n**Bot:** ${member.user.tag} (${member.user.id})`,
        'Uyarı'
      );

    } catch (err) {
      Logger.error('GuardSystem', `onBotAdd hatası: ${err.message}`);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // WHITELIST YÖNETİMİ
  // ══════════════════════════════════════════════════════════════

  addWhitelist(guildId, userId, addedBy) {
    db.addGuardWhitelist(guildId, userId, addedBy);
    Logger.guard('GuardSystem', `Whitelist eklendi: ${userId} (${guildId})`);
  }

  removeWhitelist(guildId, userId) {
    db.removeGuardWhitelist(guildId, userId);
    Logger.guard('GuardSystem', `Whitelist kaldırıldı: ${userId} (${guildId})`);
  }

  getWhitelist(guildId) {
    return db.getGuardWhitelist(guildId);
  }
}

module.exports = new GuardSystem();