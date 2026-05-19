// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - /ticket-remove Komutu
// ═══════════════════════════════════════════════════════════════

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Embed = require('../../layouts/EmbedBuilder');
const db = require('../../database/Database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-remove')
    .setDescription('Ticket\'tan kullanıcı çıkarır')
    .addUserOption(opt =>
      opt.setName('kullanici')
        .setDescription('Çıkarılacak kullanıcı')
        .setRequired(true)
    ),

  cooldown: 5,

  async execute(interaction) {
    const ticket = db.getTicketByChannel(interaction.channelId);
    if (!ticket) {
      return interaction.reply({
        embeds: [Embed.error('Hata', 'Bu komut sadece ticket kanallarında kullanılabilir.')],
        ephemeral: true,
      });
    }

    const settings = db.getGuildSettings(interaction.guild.id);
    const isStaff = settings?.staff_role && interaction.member.roles.cache.has(settings.staff_role);
    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!isStaff && !isAdmin) {
      return interaction.reply({
        embeds: [Embed.error('Yetersiz Yetki', 'Bu işlem için yetkili rolüne sahip olmanız gerekiyor.')],
        ephemeral: true,
      });
    }

    const target = interaction.options.getMember('kullanici');
    if (!target) {
      return interaction.reply({
        embeds: [Embed.error('Hata', 'Kullanıcı bulunamadı.')],
        ephemeral: true,
      });
    }

    // Ticket sahibini çıkaramazsın
    if (target.id === ticket.user_id) {
      return interaction.reply({
        embeds: [Embed.error('Hata', 'Ticket sahibini kanaldan çıkaramazsınız.')],
        ephemeral: true,
      });
    }

    await interaction.channel.permissionOverwrites.delete(target);
    db.removeTicketParticipant(ticket.id, target.id);

    await interaction.reply({
      embeds: [Embed.success('Kullanıcı Çıkarıldı', `${target} ticket'tan çıkarıldı.`)],
    });
  },
};