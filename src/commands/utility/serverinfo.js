// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - /serverinfo Komutu
// ═══════════════════════════════════════════════════════════════

const { SlashCommandBuilder } = require('discord.js');
const Embed = require('../../layouts/EmbedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Sunucu bilgilerini gösterir'),

  cooldown: 10,

  async execute(interaction) {
    await interaction.reply({ embeds: [Embed.serverInfo(interaction.guild)] });
  },
};