// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - Message Delete Event
// ═══════════════════════════════════════════════════════════════

const LogSystem = require('../systems/LogSystem');
const Logger = require('../utils/Logger');

module.exports = {
  name: 'messageDelete',
  once: false,

  async execute(client, message) {
    try {
      if (!message.guild) return;
      await LogSystem.messageDeleteLog(message.guild, message);
    } catch (err) {
      Logger.error('MessageDelete', `Hata: ${err.message}`);
    }
  },
};