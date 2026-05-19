// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - /mute & /unmute Komutları
// ═══════════════════════════════════════════════════════════════

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Embed = require('../../layouts/EmbedBuilder');
const db = require('../../database/Database');
const LogSystem = require('../../systems/LogSystem');
const { canModerate, parseDuration, formatDuration } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Kullanıcıyı susturur (Discord Timeout)')
    .addUserOption(opt =>
      opt.setName('kullanici').setDescription('Susturulacak kullanıcı').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('sure').setDescription('Susturma süresi (örn: 10m, 1h, 1d — max 28d)').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('sebep').setDescription('Susturma sebebi').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  cooldown: 5,

  async execute(interaction) {
    const target = interaction.options.getMember('kullanici');
    const durationStr = interaction.options.getString('sure');
    const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

    if (!target) return interaction.reply({ embeds: [Embed.error('Hata', 'Kullanıcı bulunamadı.')], ephemeral: true });
    if (target.id === interaction.user.id) return interaction.reply({ embeds: [Embed.error('Hata', 'Kendinizi susturulamassınız.')], ephemeral: true });
    if (!canModerate(interaction.member, target)) return interaction.reply({ embeds: [Embed.error('Yetersiz Yetki', 'Bu kullanıcıyı susturacak hiyerarşiniz yok.')], ephemeral: true });

    const durationMs = parseDuration(durationStr);
    if (!durationMs) return interaction.reply({ embeds: [Embed.error('Hata', 'Geçersiz süre formatı. Örnek: `10m`, `1h`, `7d`')], ephemeral: true });

    // Discord max timeout: 28 gün
    const maxTimeout = 28 * 24 * 60 * 60 * 1000;
    if (durationMs > maxTimeout) return interaction.reply({ embeds: [Embed.error('Hata', 'Maksimum timeout süresi 28 gündür.')], ephemeral: true });

    await interaction.deferReply();

    try {
      try {
        await target.send({ embeds: [Embed.warning('Susturuldunuz', `**${interaction.guild.name}** sunucusunda susturuldunuz.\n\n**Süre:** ${formatDuration(durationMs)}\n**Sebep:** ${reason}`)] });
      } catch (_) {}

      await target.timeout(durationMs, `${interaction.user.tag}: ${reason}`);

      const expiresAt = Math.floor((Date.now() + durationMs) / 1000);
      const caseId = db.createModCase({
        guildId: interaction.guild.id, userId: target.id, moderatorId: interaction.user.id,
        action: 'mute', reason, duration: durationMs, expiresAt,
      });
      db.addActivePunishment(interaction.guild.id, target.id, 'mute', expiresAt, interaction.user.id, reason);
      db.incrementStat(interaction.guild.id, 'members_muted');

      await LogSystem.modLog(interaction.guild, 'mute', target.user, interaction.user, reason, {
        caseId, duration: formatDuration(durationMs), expires: expiresAt,
      });

      await interaction.editReply({
        embeds: [Embed.success('Kullanıcı Susturuldu', `**${target.user.tag}** susturuldu.\n\n**Süre:** ${formatDuration(durationMs)}\n**Bitiş:** <t:${expiresAt}:R>\n**Sebep:** ${reason}\n**Vaka:** #${caseId}`)],
      });
    } catch (err) {
      await interaction.editReply({ embeds: [Embed.error('Hata', `Mute uygulanamadı: ${err.message}`)] });
    }
  },
};