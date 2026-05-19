// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - /ticket-blacklist & /ticket-whitelist Komutları
// ═══════════════════════════════════════════════════════════════

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Embed = require('../../layouts/EmbedBuilder');
const db = require('../../database/Database');
const { parseDuration } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-blacklist')
    .setDescription('Kullanıcıyı ticket sisteminden yasaklar')
    .addUserOption(opt =>
      opt.setName('kullanici')
        .setDescription('Yasaklanacak kullanıcı')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('sebep')
        .setDescription('Yasaklama sebebi')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('sure')
        .setDescription('Yasaklama süresi (örn: 1h, 7d, 30d)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  cooldown: 5,

  async execute(interaction) {
    const settings = db.getGuildSettings(interaction.guild.id);
    const isStaff = settings?.staff_role && interaction.member.roles.cache.has(settings.staff_role);
    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!isStaff && !isAdmin) {
      return interaction.reply({
        embeds: [Embed.error('Yetersiz Yetki', 'Bu işlem için yetkili rolüne sahip olmanız gerekiyor.')],
        ephemeral: true,
      });
    }

    const target = interaction.options.getUser('kullanici');
    const reason = interaction.options.getString('sebep') || 'Belirtilmedi';
    const durationStr = interaction.options.getString('sure');

    let expiresAt = null;
    if (durationStr) {
      const ms = parseDuration(durationStr);
      if (ms) {
        expiresAt = Math.floor((Date.now() + ms) / 1000);
      }
    }

    db.addTicketBlacklist(interaction.guild.id, target.id, reason, interaction.user.id, expiresAt);

    const durationText = expiresAt ? `\n**Bitiş:** <t:${expiresAt}:R>` : '\n**Süre:** Kalıcı';

    await interaction.reply({
      embeds: [Embed.success(
        'Kara Listeye Eklendi',
        `${target} ticket sisteminden yasaklandı.\n**Sebep:** ${reason}${durationText}`
      )],
    });
  },
};