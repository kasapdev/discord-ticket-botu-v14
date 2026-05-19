// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - Guild Member Add Event
// ═══════════════════════════════════════════════════════════════

const LogSystem = require('../systems/LogSystem');
const GuardSystem = require('../systems/GuardSystem');
const Logger = require('../utils/Logger');

module.exports = {
  name: 'guildMemberAdd',
  once: false,

  async execute(client, member) {
    try {
      // Bot ekleme guard kontrolü
      if (member.user.bot) {
        await GuardSystem.onBotAdd(member.guild, member);
      }

      // Üye katılma logu
      await LogSystem.memberJoinLog(member.guild, member);

    } catch (err) {
      Logger.error('GuildMemberAdd', `Hata: ${err.message}`);
    }
  },
};