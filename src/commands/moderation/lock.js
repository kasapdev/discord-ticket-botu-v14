// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - /lock & /unlock Komutları
// ═══════════════════════════════════════════════════════════════

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Embed = require('../../layouts/EmbedBuilder');
const LogSystem = require('../../systems/LogSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Kanalı kilitler (mesaj gönderilemez)')
    .addChannelOption(opt =>
      opt.setName('kanal').setDescription('Kilitlenecek kanal (boş = mevcut kanal)').setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('sebep').setDescription('Kilitleme sebebi').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  cooldown: 5,

  async execute(interaction) {
    const channel = interaction.options.getChannel('kanal') || interaction.channel;
    const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

    try {
      await channel.permissionOverwrites.edit(interaction.guild.id, {
        SendMessages: false,
      });

      await LogSystem.modLog(interaction.guild, 'lock', interaction.user, interaction.user, reason, { channel });

      await interaction.reply({
        embeds: [Embed.success('Kanal Kilitlendi', `${channel} kanalı kilitlendi.\n\n**Sebep:** ${reason}`)],
      });

      if (channel.id !== interaction.channelId) {
        await channel.send({
          embeds: [Embed.warning('Kanal Kilitlendi', `Bu kanal **${interaction.user.tag}** tarafından kilitlendi.\n\n**Sebep:** ${reason}`)],
        });
      }
    } catch (err) {
      await interaction.reply({ embeds: [Embed.error('Hata', `Kanal kilitlenemedi: ${err.message}`)], ephemeral: true });
    }
  },
};