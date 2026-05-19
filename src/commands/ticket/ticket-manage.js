// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - Ticket Yönetim Komutları
// ═══════════════════════════════════════════════════════════════

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require('discord.js');
const Embed = require('../../layouts/EmbedBuilder');
const db = require('../../database/Database');
const { sanitizeChannelName } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-add')
    .setDescription('Ticket\'a kullanıcı ekler')
    .addUserOption(opt =>
      opt.setName('kullanici')
        .setDescription('Eklenecek kullanıcı')
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
    const isOwner = interaction.user.id === ticket.user_id;

    if (!isStaff && !isAdmin && !isOwner) {
      return interaction.reply({
        embeds: [Embed.error('Yetersiz Yetki', 'Bu işlem için yetkiniz yok.')],
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

    await interaction.channel.permissionOverwrites.edit(target, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    });

    db.addTicketParticipant(ticket.id, target.id, interaction.user.id);

    await interaction.reply({
      embeds: [Embed.success('Kullanıcı Eklendi', `${target} ticket\'a eklendi.`)],
    });
  },
};