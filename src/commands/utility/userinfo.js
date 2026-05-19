// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - /userinfo & /serverinfo & /botinfo Komutları
// ═══════════════════════════════════════════════════════════════

const { SlashCommandBuilder } = require('discord.js');
const Embed = require('../../layouts/EmbedBuilder');
const db = require('../../database/Database');
const config = require('../../config/config');
const { formatNumber, accountAge } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Kullanıcı bilgilerini gösterir')
    .addUserOption(opt =>
      opt.setName('kullanici').setDescription('Bilgileri görüntülenecek kullanıcı').setRequired(false)
    ),

  cooldown: 5,

  async execute(interaction) {
    const targetUser = interaction.options.getUser('kullanici') || interaction.user;
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!member) {
      return interaction.reply({
        embeds: [Embed.error('Hata', 'Kullanıcı bu sunucuda bulunamadı.')],
        ephemeral: true,
      });
    }

    // Moderasyon geçmişi
    const warnings = db.getWarnings(interaction.guild.id, targetUser.id);
    const modCases = db.getModCases(interaction.guild.id, targetUser.id);
    const warnPoints = db.getWarningPoints(interaction.guild.id, targetUser.id);

    const roles = member.roles.cache
      .filter(r => r.id !== interaction.guild.id)
      .sort((a, b) => b.position - a.position)
      .map(r => `${r}`)
      .slice(0, 8);

    const embed = Embed.premium({
      color: member.displayColor || config.colors.primary,
      title: `👤 ${targetUser.tag}`,
      thumbnail: targetUser.displayAvatarURL({ dynamic: true, size: 256 }),
      fields: [
        { name: '🆔 ID', value: targetUser.id, inline: true },
        { name: '🤖 Bot', value: targetUser.bot ? 'Evet' : 'Hayır', inline: true },
        { name: '🎭 En Yüksek Rol', value: `${member.roles.highest}`, inline: true },
        { name: '📅 Hesap Oluşturma', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>\n(<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>)`, inline: true },
        { name: '📥 Sunucuya Katılma', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>\n(<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)`, inline: true },
        { name: '⏰ Hesap Yaşı', value: accountAge(targetUser.createdAt), inline: true },
        { name: `🎭 Roller (${member.roles.cache.size - 1})`, value: roles.length > 0 ? roles.join(' ') : 'Yok', inline: false },
        { name: '⚠️ Uyarılar', value: `${warnings.length} uyarı (${warnPoints} puan)`, inline: true },
        { name: '📋 Mod Vakaları', value: `${modCases.length} vaka`, inline: true },
      ],
      footer: `ID: ${targetUser.id}`,
    });

    await interaction.reply({ embeds: [embed] });
  },
};