// kasapac tarafindan yapilmistir.
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// METETICKET BOT - Ready Event
// âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

const { ActivityType } = require('discord.js');
const config = require('../config/config');
const Logger = require('../utils/Logger');
const db = require('../database/Database');
const TicketSystem = require('../systems/TicketSystem');

module.exports = {
  name: 'clientReady',
  once: true,

  async execute(client) {
    Logger.success('Ready', `${client.user.tag} olarak giriş yapğąldğą!`);
    Logger.info('Ready', `${client.guilds.cache.size} sunucu | ${client.users.cache.size} kullanğącğą`);

    // Bot aktivitesi ayarla
    const activities = [
      { name: `${client.guilds.cache.size} sunucu`, type: ActivityType.Watching },
      { name: '/ticket-panel | MeteTicket', type: ActivityType.Playing },
      { name: 'Destek talepleri', type: ActivityType.Listening },
    ];

    let activityIndex = 0;
    const setActivity = () => {
      const activity = activities[activityIndex % activities.length];
      client.user.setPresence({
        activities: [activity],
        status: 'online',
      });
      activityIndex++;
    };

    setActivity();
    setInterval(setActivity, 30000); // 30 saniyede bir değiştir

    // Süresi dolmuş cezalarğą kontrol et
    _checkExpiredPunishments(client);
    setInterval(() => _checkExpiredPunishments(client), 60000); // Her dakika

    // Ticket inactivity kontrolü
    if (config.ticket.inactivityTimeout > 0) {
      setInterval(() => TicketSystem.checkInactivity(client), 3600000); // Her saat
    }

    // Guild'leri database'e kaydet
    for (const guild of client.guilds.cache.values()) {
      const settings = db.getGuildSettings(guild.id);
      if (!settings) {
        db.setGuildSetting(guild.id, 'language', 'tr');
        Logger.info('Ready', `Yeni guild kaydedildi: ${guild.name}`);
      }
    }

    Logger.banner(config.bot.name, config.bot.version);
  },
};

/**
 * Süresi dolmuş cezalarğą kontrol eder ve kaldğąrğąr
 */
async function _checkExpiredPunishments(client) {
  try {
    const expired = db.getExpiredPunishments();

    for (const punishment of expired) {
      try {
        const guild = client.guilds.cache.get(punishment.guild_id);
        if (!guild) {
          db.removeActivePunishment(punishment.id);
          continue;
        }

        if (punishment.type === 'mute') {
          const member = await guild.members.fetch(punishment.user_id).catch(() => null);
          if (member) {
            const settings = db.getGuildSettings(guild.id);
            if (settings?.mute_role) {
              await member.roles.remove(settings.mute_role, 'Susturma süresi doldu').catch(() => {});
            }
            // Timeout kaldğąr
            await member.timeout(null, 'Timeout süresi doldu').catch(() => {});
          }
        }

        db.removeActivePunishment(punishment.id);
        Logger.info('Ready', `Süresi dolmuş ceza kaldğąrğąldğą: ${punishment.type} â ${punishment.user_id}`);
      } catch (err) {
        Logger.error('Ready', `Ceza kaldğąrma hatasğą: ${err.message}`);
        db.removeActivePunishment(punishment.id);
      }
    }
  } catch (err) {
    Logger.error('Ready', `Expired punishment check hatasğą: ${err.message}`);
  }
}