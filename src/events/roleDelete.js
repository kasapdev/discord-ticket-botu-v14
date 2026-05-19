// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - Role Delete Event
// ═══════════════════════════════════════════════════════════════

const LogSystem = require('../systems/LogSystem');
const GuardSystem = require('../systems/GuardSystem');
const Logger = require('../utils/Logger');

module.exports = {
  name: 'roleDelete',
  once: false,

  async execute(client, role) {
    try {
      await GuardSystem.onRoleDelete(role.guild, role);
      await LogSystem.roleDeleteLog(role.guild, role);
    } catch (err) {
      Logger.error('RoleDelete', `Hata: ${err.message}`);
    }
  },
};