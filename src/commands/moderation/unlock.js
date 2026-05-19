// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - /unlock Komutu
// ═══════════════════════════════════════════════════════════════

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Embed = require('../../layouts/EmbedBuilder');
const LogSystem = require('../../systems/LogSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Kanalın kilidini açar')
    .addChannelOption(opt =>
      opt.setName('kanal').setDescription('Kilidi açılacak kanal (boş = mevcut kanal)').setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('sebep').setDescription('Sebep').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  cooldown: 5,

  async execute(interaction) {
    const channel = interaction.options.getChannel('kanal') || interaction.channel;
    const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

    try {
      await channel.permissionOverwrites.edit(interaction.guild.id, {
        SendMessages: null,
      });

      await LogSystem.modLog(interaction.guild, 'unlock', interaction.user, interaction.user, reason, { channel });

      await interaction.reply({
        embeds: [Embed.success('Kanal Kilidi Açıldı', `${channel} kanalının kilidi açıldı.\n\n**Sebep:** ${reason}`)],
      });

      if (channel.id !== interaction.channelId) {
        await channel.send({
          embeds: [Embed.success('Kanal Kilidi Açıldı', `Bu kanalın kilidi **${interaction.user.tag}** tarafından açıldı.`)],
        });
      }
    } catch (err) {
      await interaction.reply({ embeds: [Embed.error('Hata', `Kanal kilidi açılamadı: ${err.message}`)], ephemeral: true });
    }
  },
};