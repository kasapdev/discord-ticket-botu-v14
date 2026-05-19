// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - /unmute Komutu
// ═══════════════════════════════════════════════════════════════

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Embed = require('../../layouts/EmbedBuilder');
const db = require('../../database/Database');
const LogSystem = require('../../systems/LogSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Kullanıcının susturmasını kaldırır')
    .addUserOption(opt =>
      opt.setName('kullanici').setDescription('Susturması kaldırılacak kullanıcı').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('sebep').setDescription('Sebep').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  cooldown: 5,

  async execute(interaction) {
    const target = interaction.options.getMember('kullanici');
    const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

    if (!target) return interaction.reply({ embeds: [Embed.error('Hata', 'Kullanıcı bulunamadı.')], ephemeral: true });

    if (!target.isCommunicationDisabled()) {
      return interaction.reply({ embeds: [Embed.warning('Hata', 'Bu kullanıcı zaten susturulmamış.')], ephemeral: true });
    }

    await interaction.deferReply();

    try {
      await target.timeout(null, `${interaction.user.tag}: ${reason}`);

      const caseId = db.createModCase({
        guildId: interaction.guild.id, userId: target.id,
        moderatorId: interaction.user.id, action: 'unmute', reason,
      });

      await LogSystem.modLog(interaction.guild, 'unmute', target.user, interaction.user, reason, { caseId });

      try {
        await target.send({ embeds: [Embed.success('Susturma Kaldırıldı', `**${interaction.guild.name}** sunucusundaki susturmanız kaldırıldı.\n\n**Sebep:** ${reason}`)] });
      } catch (_) {}

      await interaction.editReply({
        embeds: [Embed.success('Susturma Kaldırıldı', `**${target.user.tag}** kullanıcısının susturması kaldırıldı.\n\n**Sebep:** ${reason}\n**Vaka:** #${caseId}`)],
      });
    } catch (err) {
      await interaction.editReply({ embeds: [Embed.error('Hata', `Unmute uygulanamadı: ${err.message}`)] });
    }
  },
};