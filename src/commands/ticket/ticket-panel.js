// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - /ticket-panel Komutu (Gelismis Panel Duzenleyici)
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
const TicketSystem = require('../../systems/TicketSystem');
const db = require('../../database/Database');
const LogSystem = require('../../systems/LogSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('Ticket panelini yonetir')
    .addSubcommand(sub =>
      sub.setName('gonder')
        .setDescription('Ticket panelini bir kanala gonderir')
        .addChannelOption(opt =>
          opt.setName('kanal').setDescription('Panelin gonderilecegi kanal').setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('duzenle')
        .setDescription('Panel basligini, aciklamasini ve resmini duzenler')
    )
    .addSubcommand(sub =>
      sub.setName('kategoriler')
        .setDescription('Panel kategori satirlarini duzenler')
    )
    .addSubcommand(sub =>
      sub.setName('ayarlar')
        .setDescription('Panel footer ve renk ayarlari')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  cooldown: 5,

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'gonder') {
      const channel = interaction.options.getChannel('kanal') || interaction.channel;

      try {
        const msg = await TicketSystem.sendPanel(channel, interaction.guild);

        // Panel mesaj ID'sini kaydet
        db.setGuildSetting(interaction.guild.id, 'panel_message_id', msg.id);
        db.setGuildSetting(interaction.guild.id, 'panel_channel_id', channel.id);

        // Log
        await LogSystem.ticketLog(interaction.guild, 'panel_sent', {
          channel,
          executor: interaction.user,
        });

        await interaction.reply({
          embeds: [Embed.success('Panel Gonderildi', `Ticket paneli ${channel} kanalina basariyla gonderildi.`)],
          ephemeral: true,
        });
      } catch (err) {
        await interaction.reply({
          embeds: [Embed.error('Hata', `Panel gonderilemedi: ${err.message}`)],
          ephemeral: true,
        });
      }
    }

    else if (sub === 'duzenle') {
      const settings = db.getGuildSettings(interaction.guild.id) || {};

      const modal = new ModalBuilder()
        .setCustomId('panel_edit_modal')
        .setTitle('Panel Duzenle');

      const titleInput = new TextInputBuilder()
        .setCustomId('panel_title')
        .setLabel('Panel Basligi')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Metehan Studios | Destek Sistemi')
        .setValue(settings.panel_title || `${interaction.guild.name} | Destek Sistemi`)
        .setMaxLength(100)
        .setRequired(true);

      const descInput = new TextInputBuilder()
        .setCustomId('panel_description')
        .setLabel('Panel Aciklamasi')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Asagidaki basliklardan konunuza en yakin olani secin...')
        .setValue(settings.panel_description || 'Asagidaki basliklardan konunuza en yakin olani secerek hizlica ticket olusturabilirsiniz.')
        .setMaxLength(500)
        .setRequired(true);

      const imageInput = new TextInputBuilder()
        .setCustomId('panel_image')
        .setLabel('Panel Resmi (URL) - Bos birakabilirsiniz')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('https://i.imgur.com/...')
        .setValue(settings.panel_image || '')
        .setRequired(false);

      const footerInput = new TextInputBuilder()
        .setCustomId('panel_footer')
        .setLabel('Footer Metni')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Cyra Bot's | Ticket Sistemi")
        .setValue(settings.panel_footer || `${interaction.guild.name} | Ticket Sistemi`)
        .setMaxLength(100)
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(descInput),
        new ActionRowBuilder().addComponents(imageInput),
        new ActionRowBuilder().addComponents(footerInput),
      );

      await interaction.showModal(modal);
    }

    else if (sub === 'kategoriler') {
      const settings = db.getGuildSettings(interaction.guild.id) || {};
      const config = require('../../config/config');

      // Mevcut kategorileri goster
      const currentCats = config.ticket.categories.map((c, i) =>
        `${i + 1}. ${c.emoji} **${c.label}** — ${c.description} | Buton: \`${c.buttonLabel || c.label}\``
      ).join('\n');

      const modal = new ModalBuilder()
        .setCustomId('panel_categories_modal')
        .setTitle('Kategori Satirlarini Duzenle');

      const catsInput = new TextInputBuilder()
        .setCustomId('panel_categories')
        .setLabel('Kategoriler (her satir: emoji|isim|aciklama|buton)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder(
          '</> Destek|Destek, Bug & Teknik Sorunlar|Teknik problemler icin|Destek\n' +
          '🎓 Satis|Satis & Odeme Islemleri|Urun satin alimi icin|Satis\n' +
          '🖥️ Sunucu|VPS & Sunucu Destek|Sunucu sorunlari icin|Sunucu\n' +
          '✉️ Partnerlik|Partnerlik & Diger|Diger talepler icin|Partnerlik'
        )
        .setValue(
          config.ticket.categories.map(c =>
            `${c.emoji} ${c.label}|${c.label}|${c.description}|${c.buttonLabel || c.label}`
          ).join('\n')
        )
        .setMaxLength(1000)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(catsInput),
      );

      await interaction.showModal(modal);
    }

    else if (sub === 'ayarlar') {
      const settings = db.getGuildSettings(interaction.guild.id) || {};

      const modal = new ModalBuilder()
        .setCustomId('panel_settings_modal')
        .setTitle('Panel Ayarlari');

      const colorInput = new TextInputBuilder()
        .setCustomId('panel_color')
        .setLabel('Embed Rengi (hex, ornek: #5865F2)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('#5865F2')
        .setValue(settings.panel_color || '#5865F2')
        .setMaxLength(7)
        .setRequired(false);

      const thumbnailInput = new TextInputBuilder()
        .setCustomId('panel_thumbnail')
        .setLabel('Thumbnail URL (bos = sunucu ikonu)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('https://i.imgur.com/...')
        .setValue(settings.panel_thumbnail || '')
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(colorInput),
        new ActionRowBuilder().addComponents(thumbnailInput),
      );

      await interaction.showModal(modal);
    }
  },
};