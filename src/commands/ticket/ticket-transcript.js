// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - /ticket-transcript Komutu
// ═══════════════════════════════════════════════════════════════

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Embed = require('../../layouts/EmbedBuilder');
const db = require('../../database/Database');
const TranscriptSystem = require('../../systems/TranscriptSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-transcript')
    .setDescription('Ticket transcript\'ını oluşturur')
    .addStringOption(opt =>
      opt.setName('ticket-id')
        .setDescription('Transcript alınacak ticket ID (boş bırakılırsa mevcut kanal)')
        .setRequired(false)
    ),

  cooldown: 10,

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const ticketId = interaction.options.getString('ticket-id');
    let ticket;

    if (ticketId) {
      ticket = db.getTicket(ticketId);
      if (!ticket || ticket.guild_id !== interaction.guild.id) {
        return interaction.editReply({
          embeds: [Embed.error('Bulunamadı', 'Belirtilen ticket ID bulunamadı.')],
        });
      }
    } else {
      ticket = db.getTicketByChannel(interaction.channelId);
      if (!ticket) {
        return interaction.editReply({
          embeds: [Embed.error('Hata', 'Bu komut sadece ticket kanallarında kullanılabilir.')],
        });
      }
    }

    const settings = db.getGuildSettings(interaction.guild.id);
    const isStaff = settings?.staff_role && interaction.member.roles.cache.has(settings.staff_role);
    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
    const isOwner = interaction.user.id === ticket.user_id;

    if (!isStaff && !isAdmin && !isOwner) {
      return interaction.editReply({
        embeds: [Embed.error('Yetersiz Yetki', 'Bu işlem için yetkiniz yok.')],
      });
    }

    const channel = interaction.guild.channels.cache.get(ticket.channel_id) || interaction.channel;

    try {
      const transcriptFile = await TranscriptSystem.generate(ticket, channel, interaction.guild);

      if (!transcriptFile) {
        return interaction.editReply({
          embeds: [Embed.error('Hata', 'Transcript oluşturulamadı.')],
        });
      }

      await interaction.editReply({
        embeds: [Embed.success('Transcript Hazır', `**Ticket ID:** ${ticket.id}\n**Mesaj Sayısı:** ${ticket.message_count}`)],
        files: [transcriptFile],
      });
    } catch (err) {
      await interaction.editReply({
        embeds: [Embed.error('Hata', `Transcript oluşturulurken hata: ${err.message}`)],
      });
    }
  },
};