// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - Guild Ban Add + Voice State Update Events
// ═══════════════════════════════════════════════════════════════

const LogSystem = require('../systems/LogSystem');
const GuardSystem = require('../systems/GuardSystem');
const Logger = require('../utils/Logger');

module.exports = {
  name: 'guildBanAdd',
  once: false,

  async execute(client, ban) {
    try {
      await GuardSystem.onMemberBan(ban.guild, ban.user);
    } catch (err) {
      Logger.error('GuildBanAdd', `Hata: ${err.message}`);
    }
  },
};