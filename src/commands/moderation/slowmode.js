// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - /slowmode Komutu
// ═══════════════════════════════════════════════════════════════

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Embed = require('../../layouts/EmbedBuilder');
const LogSystem = require('../../systems/LogSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Kanal yavaş modunu ayarlar')
    .addIntegerOption(opt =>
      opt.setName('saniye').setDescription('Yavaş mod süresi saniye (0 = kapat)').setMinValue(0).setMaxValue(21600).setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName('kanal').setDescription('Kanal (boş = mevcut)').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  cooldown: 5,

  async execute(interaction) {
    const seconds = interaction.options.getInteger('saniye');
    const channel = interaction.options.getChannel('kanal') || interaction.channel;

    try {
      await channel.setRateLimitPerUser(seconds);

      const message = seconds === 0
        ? `${channel} kanalının yavaş modu kapatıldı.`
        : `${channel} kanalına **${seconds} saniye** yavaş mod uygulandı.`;

      await LogSystem.modLog(interaction.guild, 'slowmode', interaction.user, interaction.user, `${seconds}s`, { channel });

      await interaction.reply({
        embeds: [Embed.success('Yavaş Mod', message)],
      });
    } catch (err) {
      await interaction.reply({ embeds: [Embed.error('Hata', `Yavaş mod ayarlanamadı: ${err.message}`)], ephemeral: true });
    }
  },
};