// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - /ticket-rename, /ticket-claim, /ticket-priority, /ticket-blacklist
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
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-rename')
    .setDescription('Ticket kanalını yeniden adlandırır')
    .addStringOption(opt =>
      opt.setName('isim')
        .setDescription('Yeni kanal adı')
        .setRequired(true)
        .setMaxLength(100)
    ),

  cooldown: 10,

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

    const newName = interaction.options.getString('isim');
    const sanitized = sanitizeChannelName(newName);

    await interaction.channel.setName(sanitized);

    await interaction.reply({
      embeds: [Embed.success('Yeniden Adlandırıldı', `Ticket kanalı **${sanitized}** olarak yeniden adlandırıldı.`)],
    });
  },
};