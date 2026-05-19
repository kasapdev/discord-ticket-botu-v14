// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - /warnings Komutu
// ═══════════════════════════════════════════════════════════════

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Embed = require('../../layouts/EmbedBuilder');
const db = require('../../database/Database');
const config = require('../../config/config');
const { discordTimestamp } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Kullanıcının uyarılarını yönetir')
    .addSubcommand(sub =>
      sub.setName('list').setDescription('Uyarıları listeler')
        .addUserOption(opt => opt.setName('kullanici').setDescription('Kullanıcı').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('clear').setDescription('Tüm uyarıları temizler')
        .addUserOption(opt => opt.setName('kullanici').setDescription('Kullanıcı').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('remove').setDescription('Belirli bir uyarıyı kaldırır')
        .addIntegerOption(opt => opt.setName('id').setDescription('Uyarı ID').setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  cooldown: 5,

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'clear') {
      const target = interaction.options.getUser('kullanici');
      db.clearWarnings(interaction.guild.id, target.id);
      return interaction.reply({
        embeds: [Embed.success('Uyarılar Temizlendi', `**${target.tag}** kullanıcısının tüm uyarıları temizlendi.`)],
      });
    }

    if (subcommand === 'remove') {
      const warnId = interaction.options.getInteger('id');
      const warning = db._get('SELECT * FROM warnings WHERE id = ? AND guild_id = ?', [warnId, interaction.guild.id]);
      if (!warning) {
        return interaction.reply({ embeds: [Embed.error('Bulunamadı', `#${warnId} ID'li uyarı bulunamadı.`)], ephemeral: true });
      }
      db.removeWarning(warnId);
      return interaction.reply({
        embeds: [Embed.success('Uyarı Kaldırıldı', `#${warnId} ID'li uyarı kaldırıldı.`)],
      });
    }

    // List
    const target = interaction.options.getUser('kullanici') || interaction.user;
    const warnings = db.getWarnings(interaction.guild.id, target.id);
    const totalPoints = db.getWarningPoints(interaction.guild.id, target.id);

    if (warnings.length === 0) {
      return interaction.reply({
        embeds: [Embed.info('Uyarı Yok', `**${target.tag}** kullanıcısının hiç uyarısı yok.`)],
        ephemeral: true,
      });
    }

    const warningList = warnings.slice(0, 10).map((w) =>
      `**#${w.id}** — ${w.reason}\n> Moderatör: <@${w.moderator_id}> • Puan: ${w.points} • ${discordTimestamp(w.created_at, 'R')}`
    ).join('\n\n');

    await interaction.reply({
      embeds: [Embed.premium({
        color: config.colors.warning,
        title: `⚠️ Uyarı Geçmişi — ${target.tag}`,
        description: warningList,
        fields: [
          { name: '📊 Toplam Puan', value: `${totalPoints}/${config.moderation.maxWarnPoints}`, inline: true },
          { name: '📋 Uyarı Sayısı', value: `${warnings.length}`, inline: true },
        ],
        thumbnail: target.displayAvatarURL({ dynamic: true }),
        footer: `Kullanıcı ID: ${target.id}`,
      })],
    });
  },
};