// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - Guild Member Remove Event
// ═══════════════════════════════════════════════════════════════

const LogSystem = require('../systems/LogSystem');
const Logger = require('../utils/Logger');

module.exports = {
  name: 'guildMemberRemove',
  once: false,

  async execute(client, member) {
    try {
      await LogSystem.memberLeaveLog(member.guild, member);
    } catch (err) {
      Logger.error('GuildMemberRemove', `Hata: ${err.message}`);
    }
  },
};