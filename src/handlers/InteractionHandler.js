// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - Interaction Handler (Button/Select/Modal)
// ═══════════════════════════════════════════════════════════════

const Logger = require('../utils/Logger');
const Embed = require('../layouts/EmbedBuilder');

class InteractionHandler {
  constructor(client) {
    this.client = client;
    // Button handler map: customId prefix -> handler function
    this.buttonHandlers = new Map();
    this.selectHandlers = new Map();
    this.modalHandlers = new Map();
    this._registerHandlers();
  }

  /**
   * Tüm handler'ları kayıt eder
   */
  _registerHandlers() {
    // Ticket butonları
    this.buttonHandlers.set('ticket_create_', this._handleTicketCreate.bind(this));
    this.buttonHandlers.set('ticket_close', this._handleTicketClose.bind(this));
    this.buttonHandlers.set('ticket_delete', this._handleTicketDelete.bind(this));
    this.buttonHandlers.set('ticket_claim', this._handleTicketClaim.bind(this));
    this.buttonHandlers.set('ticket_unclaim', this._handleTicketUnclaim.bind(this));
    this.buttonHandlers.set('ticket_reopen', this._handleTicketReopen.bind(this));
    this.buttonHandlers.set('ticket_transcript', this._handleTicketTranscript.bind(this));
    this.buttonHandlers.set('ticket_confirm_close', this._handleTicketConfirmClose.bind(this));
    this.buttonHandlers.set('ticket_cancel_close', this._handleTicketCancelClose.bind(this));
    this.buttonHandlers.set('ticket_rate_', this._handleTicketRate.bind(this));

    // Select menu handler'ları
    this.selectHandlers.set('ticket_category_select', this._handleTicketCategorySelect.bind(this));
    this.selectHandlers.set('ticket_priority_select', this._handleTicketPrioritySelect.bind(this));

    // Modal handler'ları
    this.modalHandlers.set('ticket_create_modal_', this._handleTicketCreateModal.bind(this));
    this.modalHandlers.set('ticket_close_reason_modal', this._handleTicketCloseReasonModal.bind(this));
    this.modalHandlers.set('ticket_rename_modal', this._handleTicketRenameModal.bind(this));

    // Panel modal handler'ları
    this.modalHandlers.set('panel_edit_modal', this._handlePanelEditModal.bind(this));
    this.modalHandlers.set('panel_categories_modal', this._handlePanelCategoriesModal.bind(this));
    this.modalHandlers.set('panel_settings_modal', this._handlePanelSettingsModal.bind(this));
  }

  /**
   * Ana interaction router
   */
  async handle(interaction) {
    // Guild-only mod: sadece belirtilen guild'den gelen interaction'ları işle
    if (process.env.GUILD_ID && interaction.guildId && interaction.guildId !== process.env.GUILD_ID) {
      return;
    }

    try {
      if (interaction.isButton()) {
        await this._handleButton(interaction);
      } else if (interaction.isStringSelectMenu()) {
        await this._handleSelect(interaction);
      } else if (interaction.isModalSubmit()) {
        await this._handleModal(interaction);
      }
    } catch (err) {
      Logger.error('InteractionHandler', `Interaction hatası: ${interaction.customId}`, err);
      try {
        const errorEmbed = Embed.error('Hata', `İşlem sırasında bir hata oluştu: ${err.message}`);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
          await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
      } catch (_) {}
    }
  }

  /**
   * Button interaction router
   */
  async _handleButton(interaction) {
    const customId = interaction.customId;
    Logger.debug('InteractionHandler', `Button: ${customId} — ${interaction.user.tag}`);

    // Prefix bazlı eşleştirme
    for (const [prefix, handler] of this.buttonHandlers) {
      if (customId === prefix || customId.startsWith(prefix + '_') || customId.startsWith(prefix)) {
        return await handler(interaction);
      }
    }

    Logger.warn('InteractionHandler', `İşlenmeyen button: ${customId}`);
  }

  /**
   * Select menu interaction router
   */
  async _handleSelect(interaction) {
    const customId = interaction.customId;
    Logger.debug('InteractionHandler', `Select: ${customId} — ${interaction.user.tag}`);

    const handler = this.selectHandlers.get(customId);
    if (handler) {
      return await handler(interaction);
    }

    Logger.warn('InteractionHandler', `İşlenmeyen select: ${customId}`);
  }

  /**
   * Modal interaction router
   */
  async _handleModal(interaction) {
    const customId = interaction.customId;
    Logger.debug('InteractionHandler', `Modal: ${customId} — ${interaction.user.tag}`);

    for (const [prefix, handler] of this.modalHandlers) {
      if (customId === prefix || customId.startsWith(prefix)) {
        return await handler(interaction);
      }
    }

    Logger.warn('InteractionHandler', `İşlenmeyen modal: ${customId}`);
  }

  // ══════════════════════════════════════════════════════════════
  // TICKET BUTTON HANDLERS
  // ══════════════════════════════════════════════════════════════

  async _handleTicketCreate(interaction) {
    const TicketSystem = require('../systems/TicketSystem');
    await TicketSystem.handleCreateButton(interaction);
  }

  async _handleTicketClose(interaction) {
    const TicketSystem = require('../systems/TicketSystem');
    await TicketSystem.handleCloseButton(interaction);
  }

  async _handleTicketDelete(interaction) {
    const TicketSystem = require('../systems/TicketSystem');
    await TicketSystem.handleDeleteButton(interaction);
  }

  async _handleTicketClaim(interaction) {
    const TicketSystem = require('../systems/TicketSystem');
    await TicketSystem.handleClaimButton(interaction);
  }

  async _handleTicketUnclaim(interaction) {
    const TicketSystem = require('../systems/TicketSystem');
    await TicketSystem.handleUnclaimButton(interaction);
  }

  async _handleTicketReopen(interaction) {
    const TicketSystem = require('../systems/TicketSystem');
    await TicketSystem.handleReopenButton(interaction);
  }

  async _handleTicketTranscript(interaction) {
    const TicketSystem = require('../systems/TicketSystem');
    await TicketSystem.handleTranscriptButton(interaction);
  }

  async _handleTicketConfirmClose(interaction) {
    const TicketSystem = require('../systems/TicketSystem');
    await TicketSystem.handleConfirmClose(interaction);
  }

  async _handleTicketCancelClose(interaction) {
    await interaction.update({
      embeds: [Embed.info('İptal Edildi', 'Ticket kapatma işlemi iptal edildi.')],
      components: [],
    });
  }

  async _handleTicketRate(interaction) {
    const TicketSystem = require('../systems/TicketSystem');
    await TicketSystem.handleRating(interaction);
  }

  // ══════════════════════════════════════════════════════════════
  // SELECT MENU HANDLERS
  // ══════════════════════════════════════════════════════════════

  async _handleTicketCategorySelect(interaction) {
    const TicketSystem = require('../systems/TicketSystem');
    await TicketSystem.handleCategorySelect(interaction);
  }

  async _handleTicketPrioritySelect(interaction) {
    const TicketSystem = require('../systems/TicketSystem');
    await TicketSystem.handlePrioritySelect(interaction);
  }

  // ══════════════════════════════════════════════════════════════
  // MODAL HANDLERS
  // ══════════════════════════════════════════════════════════════

  async _handleTicketCreateModal(interaction) {
    const TicketSystem = require('../systems/TicketSystem');
    await TicketSystem.handleCreateModal(interaction);
  }

  async _handleTicketCloseReasonModal(interaction) {
    const TicketSystem = require('../systems/TicketSystem');
    await TicketSystem.handleCloseReasonModal(interaction);
  }

  async _handleTicketRenameModal(interaction) {
    const TicketSystem = require('../systems/TicketSystem');
    await TicketSystem.handleRenameModal(interaction);
  }

  // ══════════════════════════════════════════════════════════════
  // PANEL MODAL HANDLERS
  // ══════════════════════════════════════════════════════════════

  async _handlePanelEditModal(interaction) {
    const db = require('../database/Database');
    const LogSystem = require('../systems/LogSystem');
    const config = require('../config/config');

    const title = interaction.fields.getTextInputValue('panel_title');
    const description = interaction.fields.getTextInputValue('panel_description');
    const image = interaction.fields.getTextInputValue('panel_image') || null;
    const footer = interaction.fields.getTextInputValue('panel_footer') || null;

    db.updateGuildSettings(interaction.guild.id, {
      panel_title: title,
      panel_description: description,
      panel_image: image || '',
      panel_footer: footer || '',
    });

    // Panel mesajini guncelle
    const settings = db.getGuildSettings(interaction.guild.id);
    await this._updatePanelMessage(interaction.guild, settings);

    await LogSystem.ticketLog(interaction.guild, 'panel_edit', {
      executor: interaction.user,
      guildId: interaction.guild.id,
      panelMsg: 'Panel baslik ve aciklama guncellendi',
    });

    await interaction.reply({
      embeds: [Embed.success('Panel Guncellendi', `Panel baslik ve aciklama basariyla guncellendi.\n\n**Baslik:** ${title}`)],
      ephemeral: true,
    });
  }

  async _handlePanelCategoriesModal(interaction) {
    const db = require('../database/Database');
    const config = require('../config/config');
    const LogSystem = require('../systems/LogSystem');

    const rawInput = interaction.fields.getTextInputValue('panel_categories');
    const lines = rawInput.split('\n').filter(l => l.trim());

    const newCategories = [];
    for (const line of lines) {
      const parts = line.split('|');
      if (parts.length < 2) continue;

      // Format: "emoji isim|label|aciklama|buton"
      const firstPart = parts[0].trim();
      const label = parts[1]?.trim() || firstPart;
      const description = parts[2]?.trim() || label;
      const buttonLabel = parts[3]?.trim() || label.slice(0, 20);

      // Emoji'yi ayir
      const emojiMatch = firstPart.match(/^(\S+)\s+(.+)$/);
      const emoji = emojiMatch ? emojiMatch[1] : '🎫';
      const name = emojiMatch ? emojiMatch[2] : firstPart;

      newCategories.push({
        id: name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 20),
        label: label,
        description: description,
        emoji: emoji,
        buttonLabel: buttonLabel,
        buttonStyle: 'primary',
        color: '#5865F2',
      });
    }

    if (newCategories.length === 0) {
      return interaction.reply({
        embeds: [Embed.error('Hata', 'Gecerli kategori bulunamadi. Format: `emoji isim|label|aciklama|buton`')],
        ephemeral: true,
      });
    }

    // Config'i guncelle (runtime)
    config.ticket.categories = newCategories;

    // Panel mesajini guncelle
    const settings = db.getGuildSettings(interaction.guild.id);
    await this._updatePanelMessage(interaction.guild, settings);

    await LogSystem.ticketLog(interaction.guild, 'panel_edit', {
      executor: interaction.user,
      guildId: interaction.guild.id,
      catCount: newCategories.length,
      panelMsg: 'Kategori satirlari guncellendi',
    });

    await interaction.reply({
      embeds: [Embed.success('Kategoriler Guncellendi', `**${newCategories.length}** kategori basariyla guncellendi.\n\n${newCategories.map(c => `${c.emoji} **${c.label}** — ${c.description}`).join('\n')}`)],
      ephemeral: true,
    });
  }

  async _handlePanelSettingsModal(interaction) {
    const db = require('../database/Database');
    const LogSystem = require('../systems/LogSystem');

    const color = interaction.fields.getTextInputValue('panel_color') || '#5865F2';
    const thumbnail = interaction.fields.getTextInputValue('panel_thumbnail') || '';

    db.updateGuildSettings(interaction.guild.id, {
      panel_color: color,
      panel_thumbnail: thumbnail,
    });

    // Panel mesajini guncelle
    const settings = db.getGuildSettings(interaction.guild.id);
    await this._updatePanelMessage(interaction.guild, settings);

    await interaction.reply({
      embeds: [Embed.success('Ayarlar Guncellendi', `Panel rengi ve thumbnail guncellendi.\n\n**Renk:** \`${color}\``)],
      ephemeral: true,
    });
  }

  /**
   * Mevcut panel mesajini gunceller
   */
  async _updatePanelMessage(guild, settings) {
    if (!settings?.panel_channel_id || !settings?.panel_message_id) return;

    try {
      const channel = guild.channels.cache.get(settings.panel_channel_id);
      if (!channel) return;

      const message = await channel.messages.fetch(settings.panel_message_id).catch(() => null);
      if (!message) return;

      const Embed = require('../layouts/EmbedBuilder');

      // Butonlar artik SectionBuilder icinde - sadece V2 mesaj olustur
      const msgOptions = Embed.ticketPanelMessage(guild, settings);
      await message.edit(msgOptions);
    } catch (err) {
      Logger.error('InteractionHandler', `Panel mesaji guncellenemedi: ${err.message}`);
    }
  }
}

module.exports = InteractionHandler;
