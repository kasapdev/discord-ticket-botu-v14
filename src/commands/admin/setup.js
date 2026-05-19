// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - /setup Komutu
// ═══════════════════════════════════════════════════════════════

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const Embed = require('../../layouts/EmbedBuilder');
const db = require('../../database/Database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Bot kurulum ayarlarını yapılandırır')
    .addSubcommand(sub =>
      sub.setName('ticket')
        .setDescription('Ticket sistemi ayarları')
        .addChannelOption(opt => opt.setName('kategori').setDescription('Ticket kanallarının oluşturulacağı kategori').setRequired(false))
        .addRoleOption(opt => opt.setName('staff-rol').setDescription('Yetkili rolü').setRequired(false))
        .addChannelOption(opt => opt.setName('log-kanal').setDescription('Ticket log kanalı').setRequired(false))
        .addChannelOption(opt => opt.setName('transcript-kanal').setDescription('Transcript kanalı').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('moderation')
        .setDescription('Moderasyon sistemi ayarları')
        .addChannelOption(opt => opt.setName('mod-log').setDescription('Moderasyon log kanalı').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('guard')
        .setDescription('Guard sistemi ayarları')
        .addChannelOption(opt => opt.setName('guard-log').setDescription('Guard log kanalı').setRequired(false))
        .addBooleanOption(opt => opt.setName('aktif').setDescription('Guard sistemini aç/kapat').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('logs')
        .setDescription('Genel log kanalı ayarı')
        .addChannelOption(opt => opt.setName('kanal').setDescription('Genel log kanalı').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('show')
        .setDescription('Mevcut ayarları gösterir')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  cooldown: 10,

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'show') {
      return await this._showSettings(interaction);
    }

    const settings = {};

    if (subcommand === 'ticket') {
      const category = interaction.options.getChannel('kategori');
      const staffRole = interaction.options.getRole('staff-rol');
      const logChannel = interaction.options.getChannel('log-kanal');
      const transcriptChannel = interaction.options.getChannel('transcript-kanal');

      if (category) settings.ticket_category = category.id;
      if (staffRole) settings.staff_role = staffRole.id;
      if (logChannel) settings.ticket_log_channel = logChannel.id;
      if (transcriptChannel) settings.transcript_channel = transcriptChannel.id;

      if (Object.keys(settings).length === 0) {
        return interaction.reply({
          embeds: [Embed.warning('Hata', 'En az bir ayar belirtmelisiniz.')],
          ephemeral: true,
        });
      }

      db.updateGuildSettings(interaction.guild.id, settings);

      const fields = [];
      if (category) fields.push({ name: '📂 Ticket Kategorisi', value: `${category}`, inline: true });
      if (staffRole) fields.push({ name: '🎭 Yetkili Rolü', value: `${staffRole}`, inline: true });
      if (logChannel) fields.push({ name: '📋 Ticket Log', value: `${logChannel}`, inline: true });
      if (transcriptChannel) fields.push({ name: '📄 Transcript', value: `${transcriptChannel}`, inline: true });

      return interaction.reply({
        embeds: [Embed.success('Ticket Ayarları Kaydedildi', 'Ticket sistemi ayarları başarıyla güncellendi.', { fields })],
      });
    }

    if (subcommand === 'moderation') {
      const modLog = interaction.options.getChannel('mod-log');
      if (modLog) settings.mod_log_channel = modLog.id;

      db.updateGuildSettings(interaction.guild.id, settings);

      return interaction.reply({
        embeds: [Embed.success('Moderasyon Ayarları Kaydedildi', `Moderasyon log kanalı ${modLog} olarak ayarlandı.`)],
      });
    }

    if (subcommand === 'guard') {
      const guardLog = interaction.options.getChannel('guard-log');
      const active = interaction.options.getBoolean('aktif');

      if (guardLog) settings.guard_log_channel = guardLog.id;
      if (active !== null) settings.guard_enabled = active ? 1 : 0;

      db.updateGuildSettings(interaction.guild.id, settings);

      return interaction.reply({
        embeds: [Embed.success('Guard Ayarları Kaydedildi', [
          guardLog ? `Guard log kanalı ${guardLog} olarak ayarlandı.` : '',
          active !== null ? `Guard sistemi **${active ? 'aktif' : 'devre dışı'}**.` : '',
        ].filter(Boolean).join('\n'))],
      });
    }

    if (subcommand === 'logs') {
      const channel = interaction.options.getChannel('kanal');
      db.updateGuildSettings(interaction.guild.id, { log_channel: channel.id });

      return interaction.reply({
        embeds: [Embed.success('Log Kanalı Ayarlandı', `Genel log kanalı ${channel} olarak ayarlandı.`)],
      });
    }
  },

  async _showSettings(interaction) {
    const settings = db.getGuildSettings(interaction.guild.id);

    if (!settings) {
      return interaction.reply({
        embeds: [Embed.warning('Ayar Yok', 'Bu sunucu için henüz ayar yapılmamış.')],
        ephemeral: true,
      });
    }

    const getChannel = (id) => id ? `<#${id}>` : '❌ Ayarlanmamış';
    const getRole = (id) => id ? `<@&${id}>` : '❌ Ayarlanmamış';

    await interaction.reply({
      embeds: [Embed.premium({
        color: 0x5865F2,
        title: `⚙️ ${interaction.guild.name} — Bot Ayarları`,
        fields: [
          { name: '🎫 Ticket Kategorisi', value: getChannel(settings.ticket_category), inline: true },
          { name: '🎭 Yetkili Rolü', value: getRole(settings.staff_role), inline: true },
          { name: '📋 Ticket Log', value: getChannel(settings.ticket_log_channel), inline: true },
          { name: '📄 Transcript Kanalı', value: getChannel(settings.transcript_channel), inline: true },
          { name: '🔨 Mod Log', value: getChannel(settings.mod_log_channel), inline: true },
          { name: '🛡️ Guard Log', value: getChannel(settings.guard_log_channel), inline: true },
          { name: '📢 Genel Log', value: getChannel(settings.log_channel), inline: true },
          { name: '🛡️ Guard Durumu', value: settings.guard_enabled !== 0 ? '✅ Aktif' : '❌ Devre Dışı', inline: true },
          { name: '🚫 Anti-Spam', value: settings.anti_spam_enabled !== 0 ? '✅ Aktif' : '❌ Devre Dışı', inline: true },
        ],
        thumbnail: interaction.guild.iconURL({ dynamic: true }),
        footer: `Sunucu ID: ${interaction.guild.id}`,
      })],
      ephemeral: true,
    });
  },
};