// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - Voice State Update Event
// ═══════════════════════════════════════════════════════════════

const LogSystem = require('../systems/LogSystem');
const Logger = require('../utils/Logger');

module.exports = {
  name: 'voiceStateUpdate',
  once: false,

  async execute(client, oldState, newState) {
    try {
      if (!newState.guild) return;
      await LogSystem.voiceLog(newState.guild, oldState, newState);
    } catch (err) {
      Logger.error('VoiceStateUpdate', `Hata: ${err.message}`);
    }
  },
};