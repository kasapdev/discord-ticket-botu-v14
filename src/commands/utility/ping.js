// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - /ping Komutu
// ═══════════════════════════════════════════════════════════════

const { SlashCommandBuilder } = require('discord.js');
const Embed = require('../../layouts/EmbedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Bot gecikme süresini gösterir'),

  cooldown: 5,

  async execute(interaction) {
    const sent = await interaction.reply({
      embeds: [Embed.info('Ping...', '⏳ Ölçülüyor...')],
      fetchReply: true,
    });

    const apiLatency = sent.createdTimestamp - interaction.createdTimestamp;
    const wsLatency = interaction.client.ws.ping;

    await interaction.editReply({
      embeds: [Embed.ping(wsLatency, apiLatency)],
    });
  },
};