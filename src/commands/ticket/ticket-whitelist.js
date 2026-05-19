// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - /ticket-whitelist Komutu
// ═══════════════════════════════════════════════════════════════

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Embed = require('../../layouts/EmbedBuilder');
const db = require('../../database/Database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-whitelist')
    .setDescription('Kullanıcıyı ticket kara listesinden çıkarır')
    .addUserOption(opt =>
      opt.setName('kullanici')
        .setDescription('Kara listeden çıkarılacak kullanıcı')
        .setRequired(true)
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
    const blacklisted = db.isTicketBlacklisted(interaction.guild.id, target.id);

    if (!blacklisted) {
      return interaction.reply({
        embeds: [Embed.warning('Bulunamadı', `${target} ticket kara listesinde değil.`)],
        ephemeral: true,
      });
    }

    db.removeTicketBlacklist(interaction.guild.id, target.id);

    await interaction.reply({
      embeds: [Embed.success('Kara Listeden Çıkarıldı', `${target} ticket kara listesinden çıkarıldı.`)],
    });
  },
};