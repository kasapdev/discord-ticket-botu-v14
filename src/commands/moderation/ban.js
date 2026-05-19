// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - /ban Komutu
// ═══════════════════════════════════════════════════════════════

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Embed = require('../../layouts/EmbedBuilder');
const db = require('../../database/Database');
const LogSystem = require('../../systems/LogSystem');
const { canModerate, parseDuration, formatDuration } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Kullanıcıyı sunucudan banlar')
    .addUserOption(opt =>
      opt.setName('kullanici')
        .setDescription('Banlanacak kullanıcı')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('sebep')
        .setDescription('Banlama sebebi')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('sure')
        .setDescription('Geçici ban süresi (örn: 1d, 7d)')
        .setRequired(false)
    )
    .addIntegerOption(opt =>
      opt.setName('mesaj-sil')
        .setDescription('Kaç günlük mesaj silinsin (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  cooldown: 5,

  async execute(interaction) {
    const target = interaction.options.getMember('kullanici') || interaction.options.getUser('kullanici');
    const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
    const durationStr = interaction.options.getString('sure');
    const deleteMessageDays = interaction.options.getInteger('mesaj-sil') || 0;

    if (!target) {
      return interaction.reply({
        embeds: [Embed.error('Hata', 'Kullanıcı bulunamadı.')],
        ephemeral: true,
      });
    }

    const targetUser = target.user || target;
    const targetMember = target.user ? target : null;

    // Kendini banlayamazsın
    if (targetUser.id === interaction.user.id) {
      return interaction.reply({
        embeds: [Embed.error('Hata', 'Kendinizi banlayamazsınız.')],
        ephemeral: true,
      });
    }

    // Botu banlayamazsın
    if (targetUser.bot && targetUser.id === interaction.client.user.id) {
      return interaction.reply({
        embeds: [Embed.error('Hata', 'Botu banlayamazsınız.')],
        ephemeral: true,
      });
    }

    // Hiyerarşi kontrolü
    if (targetMember && !canModerate(interaction.member, targetMember)) {
      return interaction.reply({
        embeds: [Embed.error('Yetersiz Yetki', 'Bu kullanıcıyı banlayacak hiyerarşiniz yok.')],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      // DM gönder
      try {
        await targetUser.send({
          embeds: [Embed.error(
            'Sunucudan Banlandınız',
            `**${interaction.guild.name}** sunucusundan banlandınız.\n\n**Sebep:** ${reason}`
          )],
        });
      } catch (_) {}

      // Ban uygula
      await interaction.guild.members.ban(targetUser.id, {
        reason: `${interaction.user.tag}: ${reason}`,
        deleteMessageSeconds: deleteMessageDays * 86400,
      });

      // Database'e kaydet
      const caseId = db.createModCase({
        guildId: interaction.guild.id,
        userId: targetUser.id,
        moderatorId: interaction.user.id,
        action: 'ban',
        reason,
      });

      // Geçici ban ise kaydet
      if (durationStr) {
        const ms = parseDuration(durationStr);
        if (ms) {
          const expiresAt = Math.floor((Date.now() + ms) / 1000);
          db.addActivePunishment(interaction.guild.id, targetUser.id, 'ban', expiresAt, interaction.user.id, reason);
        }
      }

      db.incrementStat(interaction.guild.id, 'members_banned');

      // Log gönder
      await LogSystem.modLog(interaction.guild, 'ban', targetUser, interaction.user, reason, {
        caseId,
        duration: durationStr ? formatDuration(parseDuration(durationStr)) : null,
      });

      await interaction.editReply({
        embeds: [Embed.success(
          'Kullanıcı Banlandı',
          `**${targetUser.tag}** başarıyla banlandı.\n\n**Sebep:** ${reason}\n**Vaka:** #${caseId}`
        )],
      });

    } catch (err) {
      await interaction.editReply({
        embeds: [Embed.error('Hata', `Ban uygulanamadı: ${err.message}`)],
      });
    }
  },
};