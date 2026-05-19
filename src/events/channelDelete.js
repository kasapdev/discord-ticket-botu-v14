// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - Channel Delete / Create / Role Events
// ═══════════════════════════════════════════════════════════════

const LogSystem = require('../systems/LogSystem');
const GuardSystem = require('../systems/GuardSystem');
const Logger = require('../utils/Logger');

module.exports = {
  name: 'channelDelete',
  once: false,

  async execute(client, channel) {
    try {
      if (!channel.guild) return;
      await GuardSystem.onChannelDelete(channel.guild, channel);
      await LogSystem.channelDeleteLog(channel.guild, channel);
    } catch (err) {
      Logger.error('ChannelDelete', `Hata: ${err.message}`);
    }
  },
};