// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - /warn & /warnings Komutları
// ═══════════════════════════════════════════════════════════════

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Embed = require('../../layouts/EmbedBuilder');
const db = require('../../database/Database');
const LogSystem = require('../../systems/LogSystem');
const config = require('../../config/config');
const { formatDuration, parseDuration } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Kullanıcıyı uyarır')
    .addUserOption(opt =>
      opt.setName('kullanici').setDescription('Uyarılacak kullanıcı').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('sebep').setDescription('Uyarı sebebi').setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('puan').setDescription('Uyarı puanı (varsayılan: 1)').setMinValue(1).setMaxValue(5).setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  cooldown: 5,

  async execute(interaction) {
    const target = interaction.options.getMember('kullanici');
    const reason = interaction.options.getString('sebep');
    const points = interaction.options.getInteger('puan') || 1;

    if (!target) return interaction.reply({ embeds: [Embed.error('Hata', 'Kullanıcı bulunamadı.')], ephemeral: true });
    if (target.id === interaction.user.id) return interaction.reply({ embeds: [Embed.error('Hata', 'Kendinizi uyaramazsınız.')], ephemeral: true });

    await interaction.deferReply();

    try {
      const warnId = db.addWarning(interaction.guild.id, target.id, interaction.user.id, reason, points);
      const totalPoints = db.getWarningPoints(interaction.guild.id, target.id);
      const warnings = db.getWarnings(interaction.guild.id, target.id);

      const caseId = db.createModCase({
        guildId: interaction.guild.id, userId: target.id,
        moderatorId: interaction.user.id, action: 'warn', reason,
      });

      // Threshold kontrolü
      let autoAction = null;
      const thresholds = config.moderation.warnThresholds;
      const thresholdKeys = Object.keys(thresholds).map(Number).sort((a, b) => a - b);

      for (const threshold of thresholdKeys) {
        if (totalPoints >= threshold) {
          autoAction = thresholds[threshold];
        }
      }

      // DM gönder
      try {
        await target.send({
          embeds: [Embed.warning('Uyarı Aldınız', `**${interaction.guild.name}** sunucusunda uyarı aldınız.\n\n**Sebep:** ${reason}\n**Puan:** ${points}\n**Toplam Puan:** ${totalPoints}/${config.moderation.maxWarnPoints}`)],
        });
      } catch (_) {}

      await LogSystem.modLog(interaction.guild, 'warn', target.user, interaction.user, reason, { caseId });

      let responseText = `**${target.user.tag}** uyarıldı.\n\n**Sebep:** ${reason}\n**Puan:** +${points}\n**Toplam:** ${totalPoints} puan\n**Uyarı Sayısı:** ${warnings.length}\n**Vaka:** #${caseId}`;

      // Otomatik ceza uygula
      if (autoAction) {
        const [actionType, actionDuration] = autoAction.split(':');
        responseText += `\n\n⚠️ **Otomatik Ceza:** ${actionType.toUpperCase()}${actionDuration ? ` (${actionDuration})` : ''}`;

        try {
          if (actionType === 'mute' && actionDuration) {
            const ms = parseDuration(actionDuration);
            if (ms) await target.timeout(ms, `Otomatik: ${totalPoints} uyarı puanı`);
          } else if (actionType === 'kick') {
            await target.kick(`Otomatik: ${totalPoints} uyarı puanı`);
          } else if (actionType === 'ban') {
            await interaction.guild.members.ban(target.id, { reason: `Otomatik: ${totalPoints} uyarı puanı` });
          }
        } catch (autoErr) {
          responseText += `\n❌ Otomatik ceza uygulanamadı: ${autoErr.message}`;
        }
      }

      await interaction.editReply({ embeds: [Embed.warning('Kullanıcı Uyarıldı', responseText)] });

    } catch (err) {
      await interaction.editReply({ embeds: [Embed.error('Hata', `Uyarı verilemedi: ${err.message}`)] });
    }
  },
};