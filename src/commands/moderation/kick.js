// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - /kick Komutu
// ═══════════════════════════════════════════════════════════════

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Embed = require('../../layouts/EmbedBuilder');
const db = require('../../database/Database');
const LogSystem = require('../../systems/LogSystem');
const { canModerate } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kullanıcıyı sunucudan atar')
    .addUserOption(opt =>
      opt.setName('kullanici').setDescription('Atılacak kullanıcı').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('sebep').setDescription('Atma sebebi').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  cooldown: 5,

  async execute(interaction) {
    const target = interaction.options.getMember('kullanici');
    const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

    if (!target) return interaction.reply({ embeds: [Embed.error('Hata', 'Kullanıcı bulunamadı.')], ephemeral: true });
    if (target.id === interaction.user.id) return interaction.reply({ embeds: [Embed.error('Hata', 'Kendinizi atamazsınız.')], ephemeral: true });
    if (!canModerate(interaction.member, target)) return interaction.reply({ embeds: [Embed.error('Yetersiz Yetki', 'Bu kullanıcıyı atacak hiyerarşiniz yok.')], ephemeral: true });

    await interaction.deferReply();

    try {
      try { await target.send({ embeds: [Embed.warning('Sunucudan Atıldınız', `**${interaction.guild.name}** sunucusundan atıldınız.\n\n**Sebep:** ${reason}`)] }); } catch (_) {}

      await target.kick(`${interaction.user.tag}: ${reason}`);

      const caseId = db.createModCase({ guildId: interaction.guild.id, userId: target.id, moderatorId: interaction.user.id, action: 'kick', reason });
      db.incrementStat(interaction.guild.id, 'members_kicked');

      await LogSystem.modLog(interaction.guild, 'kick', target.user, interaction.user, reason, { caseId });

      await interaction.editReply({ embeds: [Embed.success('Kullanıcı Atıldı', `**${target.user.tag}** sunucudan atıldı.\n\n**Sebep:** ${reason}\n**Vaka:** #${caseId}`)] });
    } catch (err) {
      await interaction.editReply({ embeds: [Embed.error('Hata', `Kick uygulanamadı: ${err.message}`)] });
    }
  },
};