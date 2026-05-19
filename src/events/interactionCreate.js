// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - Interaction Create Event
// ═══════════════════════════════════════════════════════════════

const Logger = require('../utils/Logger');

module.exports = {
  name: 'interactionCreate',
  once: false,

  async execute(client, interaction) {
    try {
      // Slash komutları
      if (interaction.isChatInputCommand()) {
        await client.commandHandler.handleInteraction(interaction);
        return;
      }

      // Button, Select Menu, Modal
      if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
        await client.interactionHandler.handle(interaction);
        return;
      }

    } catch (err) {
      Logger.error('InteractionCreate', `İşlenemeyen interaction: ${err.message}`, err);
    }
  },
};