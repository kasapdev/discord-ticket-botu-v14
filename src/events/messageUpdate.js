// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - Message Update Event
// ═══════════════════════════════════════════════════════════════

const LogSystem = require('../systems/LogSystem');
const Logger = require('../utils/Logger');

module.exports = {
  name: 'messageUpdate',
  once: false,

  async execute(client, oldMessage, newMessage) {
    try {
      if (!newMessage.guild) return;
      if (oldMessage.content === newMessage.content) return;
      await LogSystem.messageEditLog(newMessage.guild, oldMessage, newMessage);
    } catch (err) {
      Logger.error('MessageUpdate', `Hata: ${err.message}`);
    }
  },
};