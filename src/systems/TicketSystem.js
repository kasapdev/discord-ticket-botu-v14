// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - Ultra Gelişmiş Ticket Sistemi
// ═══════════════════════════════════════════════════════════════

const {
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  AttachmentBuilder,
} = require('discord.js');

const db = require('../database/Database');
const config = require('../config/config');
const Embed = require('../layouts/EmbedBuilder');
const Logger = require('../utils/Logger');
const { generateTicketId, sanitizeChannelName, formatDuration } = require('../utils/helpers');
const TranscriptSystem = require('./TranscriptSystem');
const LogSystem = require('./LogSystem');

class TicketSystem {
  constructor() {
    // Aktif ticket oluşturma işlemleri (spam önleme)
    this.creatingTickets = new Set();
  }

  // ══════════════════════════════════════════════════════════════
  // PANEL
  // ══════════════════════════════════════════════════════════════

  /**
   * Ticket paneli gönderir - fotodaki gibi butonlu panel
   */
  async sendPanel(channel, guild) {
    const settings = db.getGuildSettings(guild.id) || {};
    // Butonlar artik EmbedBuilder.ticketPanel icinde SectionBuilder ile olusturuluyor
    const msgOptions = Embed.ticketPanelMessage(guild, settings);
    return channel.send(msgOptions);
  }

  // ══════════════════════════════════════════════════════════════
  // TICKET OLUŞTURMA
  // ══════════════════════════════════════════════════════════════

  /**
   * Buton tıklaması ile ticket oluşturma (ticket_create_<categoryId>)
   */
  async handleCreateButton(interaction) {
    // customId: ticket_create_<categoryId>
    const categoryId = interaction.customId.replace('ticket_create_', '');
    const category = config.ticket.categories.find(c => c.id === categoryId);

    if (!category) {
      return interaction.reply({
        embeds: [Embed.error('Hata', 'Geçersiz kategori.')],
        ephemeral: true,
      });
    }

    // Blacklist hızlı kontrol
    const blacklisted = db.isTicketBlacklisted(interaction.guild.id, interaction.user.id);
    if (blacklisted) {
      return interaction.reply({
        embeds: [Embed.error('Kara Liste', `Ticket sistemi kara listesine alındınız.\n**Sebep:** ${blacklisted.reason || 'Belirtilmedi'}`)],
        ephemeral: true,
      });
    }

    // Modal göster
    const modal = new ModalBuilder()
      .setCustomId(`ticket_create_modal_${categoryId}`)
      .setTitle(`${category.emoji} ${category.label}`);

    const subjectInput = new TextInputBuilder()
      .setCustomId('ticket_subject')
      .setLabel('Konu')
      .setPlaceholder('Talebinizin konusunu kısaca yazın...')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(100)
      .setRequired(true);

    const descriptionInput = new TextInputBuilder()
      .setCustomId('ticket_description')
      .setLabel('Açıklama (isteğe bağlı)')
      .setPlaceholder('Sorununuzu veya talebinizi detaylı açıklayın...')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(1000)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(subjectInput),
      new ActionRowBuilder().addComponents(descriptionInput),
    );

    await interaction.showModal(modal);
  }

  /**
   * Kategori seçimi handler'ı (select menu - eski yöntem, geriye dönük uyumluluk)
   */
  async handleCategorySelect(interaction) {
    const categoryId = interaction.values[0];
    const category = config.ticket.categories.find(c => c.id === categoryId);

    if (!category) {
      return interaction.reply({
        embeds: [Embed.error('Hata', 'Geçersiz kategori seçimi.')],
        ephemeral: true,
      });
    }

    // Modal göster (konu girişi için)
    const modal = new ModalBuilder()
      .setCustomId(`ticket_create_modal_${categoryId}`)
      .setTitle(`${category.emoji} ${category.label} Talebi`);

    const subjectInput = new TextInputBuilder()
      .setCustomId('ticket_subject')
      .setLabel('Konu')
      .setPlaceholder('Talebinizin konusunu kısaca yazın...')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(100)
      .setRequired(true);

    const descriptionInput = new TextInputBuilder()
      .setCustomId('ticket_description')
      .setLabel('Açıklama')
      .setPlaceholder('Sorununuzu veya talebinizi detaylı açıklayın...')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(1000)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(subjectInput),
      new ActionRowBuilder().addComponents(descriptionInput),
    );

    await interaction.showModal(modal);
  }

  /**
   * Modal submit handler'ı
   */
  async handleCreateModal(interaction) {
    const customId = interaction.customId;
    const categoryId = customId.replace('ticket_create_modal_', '');
    const category = config.ticket.categories.find(c => c.id === categoryId);

    const subject = interaction.fields.getTextInputValue('ticket_subject');
    const description = interaction.fields.getTextInputValue('ticket_description') || null;

    await this.createTicket(interaction, categoryId, category, subject, description);
  }

  /**
   * Ticket oluşturur
   */
  async createTicket(interaction, categoryId, category, subject, description) {
    const { guild, user } = interaction;
    const key = `${guild.id}-${user.id}`;

    // Spam koruması
    if (this.creatingTickets.has(key)) {
      return interaction.reply({
        embeds: [Embed.warning('İşlem Devam Ediyor', 'Zaten bir ticket oluşturma işlemi devam ediyor.')],
        ephemeral: true,
      });
    }

    this.creatingTickets.add(key);

    try {
      await interaction.deferReply({ ephemeral: true });

      // Blacklist kontrolü
      const blacklisted = db.isTicketBlacklisted(guild.id, user.id);
      if (blacklisted) {
        this.creatingTickets.delete(key);
        return interaction.editReply({
          embeds: [Embed.error('Kara Liste', `Ticket sistemi kara listesine alındınız.\n**Sebep:** ${blacklisted.reason || 'Belirtilmedi'}`)],
        });
      }

      // Cooldown kontrolü
      const cooldownKey = `ticket_create_${guild.id}_${user.id}`;
      const cooldown = db.getCooldown(cooldownKey);
      if (cooldown) {
        this.creatingTickets.delete(key);
        return interaction.editReply({
          embeds: [Embed.warning('Cooldown', `Yeni ticket açmak için <t:${cooldown}:R> beklemelisiniz.`)],
        });
      }

      // Açık ticket limiti kontrolü
      const openTickets = db.getUserTickets(guild.id, user.id, 'open');
      if (openTickets.length >= config.ticket.maxTicketsPerUser) {
        this.creatingTickets.delete(key);
        return interaction.editReply({
          embeds: [Embed.warning('Limit Aşıldı', `Maksimum ${config.ticket.maxTicketsPerUser} açık ticket'ınız olabilir.\nMevcut açık ticket'larınızı kapatın.`)],
        });
      }

      // Guild ayarlarını al
      const settings = db.getGuildSettings(guild.id);
      const ticketCategoryId = settings?.ticket_category;

      // Ticket ID oluştur
      const ticketId = generateTicketId(guild.id);

      // Kanal adı oluştur
      const channelName = sanitizeChannelName(
        config.ticket.channelNameFormat.replace('{username}', user.username)
      );

      // Kanal oluştur
      const channelOptions = {
        name: channelName,
        type: ChannelType.GuildText,
        topic: `Ticket: ${ticketId} | Kullanıcı: ${user.tag} | Kategori: ${category?.label || categoryId}`,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.EmbedLinks,
            ],
          },
          {
            id: guild.members.me.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
        ],
      };

      // Staff rolü varsa ekle
      if (settings?.staff_role) {
        channelOptions.permissionOverwrites.push({
          id: settings.staff_role,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.ManageMessages,
          ],
        });
      }

      if (ticketCategoryId) {
        channelOptions.parent = ticketCategoryId;
      }

      const channel = await guild.channels.create(channelOptions);

      // Database'e kaydet
      const ticket = db.createTicket({
        id: ticketId,
        guildId: guild.id,
        channelId: channel.id,
        userId: user.id,
        category: categoryId,
        subject: subject,
      });

      // Cooldown ayarla
      db.setCooldown(cooldownKey, config.ticket.cooldown);

      // İstatistik güncelle
      db.incrementStat(guild.id, 'tickets_created');

      // Kontrol butonları
      const controlRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_close')
          .setLabel('Kapat')
          .setEmoji('🔒')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('ticket_claim')
          .setLabel('Sahiplen')
          .setEmoji('👋')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('ticket_transcript')
          .setLabel('Transcript')
          .setEmoji('📄')
          .setStyle(ButtonStyle.Secondary),
      );

      // Öncelik seçimi
      const priorityRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('ticket_priority_select')
          .setPlaceholder('🎯 Öncelik seviyesi seçin...')
          .addOptions(
            config.ticket.priorities.map(p => ({
              label: p.label,
              value: p.id,
              emoji: p.emoji,
            }))
          )
      );

      // Components V2 ticket acilis mesaji
      const openMsgOptions = Embed.ticketOpenMessage(ticket, user, category, settings || {}, controlRow, priorityRow);

      // Components V2 ile content kullanamayiz - once mention, sonra V2 mesaj
      const mentionContent = `${user}${settings?.staff_role ? ` <@&${settings.staff_role}>` : ''}`;
      await channel.send({ content: mentionContent });
      await channel.send(openMsgOptions);

      // Log gönder
      await LogSystem.ticketLog(guild, 'create', ticket, user, category);

      Logger.ticket('TicketSystem', `Ticket oluşturuldu: ${ticketId} — ${user.tag}`);

      await interaction.editReply({
        embeds: [Embed.success('Ticket Oluşturuldu', `Ticket'ınız başarıyla oluşturuldu!\n\n${channel} kanalına yönlendirildiniz.`)],
      });

    } catch (err) {
      Logger.error('TicketSystem', 'Ticket oluşturma hatası', err);
      try {
        await interaction.editReply({
          embeds: [Embed.error('Hata', `Ticket oluşturulurken bir hata oluştu: ${err.message}`)],
        });
      } catch (_) {}
    } finally {
      this.creatingTickets.delete(key);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // TICKET KAPATMA
  // ══════════════════════════════════════════════════════════════

  /**
   * Kapatma butonu handler'ı
   */
  async handleCloseButton(interaction) {
    const ticket = db.getTicketByChannel(interaction.channelId);
    if (!ticket) {
      return interaction.reply({
        embeds: [Embed.error('Hata', 'Bu kanal bir ticket değil.')],
        ephemeral: true,
      });
    }

    if (ticket.status !== 'open') {
      return interaction.reply({
        embeds: [Embed.warning('Zaten Kapalı', 'Bu ticket zaten kapalı.')],
        ephemeral: true,
      });
    }

    // Onay mesajı
    const confirmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_confirm_close')
        .setLabel('Evet, Kapat')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('ticket_cancel_close')
        .setLabel('İptal')
        .setEmoji('✖️')
        .setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({
      embeds: [Embed.warning('Ticket Kapatma', 'Bu ticket\'ı kapatmak istediğinizden emin misiniz?\n\nKapatıldıktan sonra transcript alınacak ve kanal kilitlenecektir.')],
      components: [confirmRow],
    });
  }

  /**
   * Kapatma onayı handler'ı
   */
  async handleConfirmClose(interaction) {
    const ticket = db.getTicketByChannel(interaction.channelId);
    if (!ticket) return;

    await interaction.deferUpdate();
    await this.closeTicket(interaction, ticket);
  }

  /**
   * Ticket'ı kapatır
   */
  async closeTicket(interaction, ticket, reason = null) {
    const { guild, channel, user } = interaction;

    try {
      // Transcript al
      let transcriptFile = null;
      if (config.ticket.transcriptEnabled) {
        transcriptFile = await TranscriptSystem.generate(ticket, channel, guild);
      }

      // Database güncelle
      db.closeTicket(ticket.id);
      db.incrementStat(guild.id, 'tickets_closed');

      // Staff performans güncelle
      if (ticket.claimed_by) {
        db.updateStaffPerformance(guild.id, ticket.claimed_by, 'tickets_closed');
      }

      // Kanal izinlerini güncelle (kullanıcı artık yazamaz)
      const ticketUser = await guild.members.fetch(ticket.user_id).catch(() => null);
      if (ticketUser) {
        await channel.permissionOverwrites.edit(ticketUser, {
          SendMessages: false,
        });
      }

      // Kapatma mesajı
      const closedEmbed = Embed.premium({
        color: config.colors.error,
        title: `${config.emojis.lock} Ticket Kapatıldı`,
        description: `Bu ticket **${user.tag}** tarafından kapatıldı.\n\n${reason ? `**Sebep:** ${reason}` : ''}`,
        fields: [
          { name: `${config.emojis.time} Kapatılma`, value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
          { name: `${config.emojis.user} Kapatan`, value: `${user}`, inline: true },
        ],
        footer: `Ticket ID: ${ticket.id}`,
      });

      const reopenRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_reopen')
          .setLabel('Yeniden Aç')
          .setEmoji('🔓')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('ticket_delete')
          .setLabel('Sil')
          .setEmoji('🗑️')
          .setStyle(ButtonStyle.Danger),
      );

      const messageOptions = {
        embeds: [closedEmbed],
        components: [reopenRow],
      };

      if (transcriptFile) {
        messageOptions.files = [transcriptFile];
      }

      await channel.send(messageOptions);

      // Transcript kanalına gönder
      const settings = db.getGuildSettings(guild.id);
      if (transcriptFile && settings?.transcript_channel) {
        const transcriptChannel = guild.channels.cache.get(settings.transcript_channel);
        if (transcriptChannel) {
          const transcriptEmbed = Embed.premium({
            color: config.colors.log,
            title: `${config.emojis.transcript} Ticket Transcript`,
            fields: [
              { name: 'Ticket ID', value: ticket.id, inline: true },
              { name: 'Kullanıcı', value: `<@${ticket.user_id}>`, inline: true },
              { name: 'Kategori', value: ticket.category, inline: true },
              { name: 'Mesaj Sayısı', value: `${ticket.message_count}`, inline: true },
              { name: 'Kapatan', value: `${user}`, inline: true },
            ],
            footer: `Ticket ID: ${ticket.id}`,
          });
          await transcriptChannel.send({ embeds: [transcriptEmbed], files: [transcriptFile] });
        }
      }

      // Log gönder
      const ticketUser2 = await guild.members.fetch(ticket.user_id).catch(() => null);
      await LogSystem.ticketLog(guild, 'close', ticket, ticketUser2?.user || { id: ticket.user_id, tag: 'Bilinmiyor' }, null, { closedBy: user, reason });

      // Kullanıcıya DM gönder
      if (ticketUser) {
        try {
          const dmEmbed = Embed.info(
            'Ticket Kapatıldı',
            `**${guild.name}** sunucusundaki ticket'ınız kapatıldı.\n\n**Ticket ID:** ${ticket.id}\n**Kategori:** ${ticket.category}${reason ? `\n**Sebep:** ${reason}` : ''}`
          );

          // Rating butonu
          if (config.ticket.ratingEnabled) {
            const ratingRow = new ActionRowBuilder().addComponents(
              ...[1, 2, 3, 4, 5].map(n =>
                new ButtonBuilder()
                  .setCustomId(`ticket_rate_${ticket.id}_${n}`)
                  .setLabel(`${n} ⭐`)
                  .setStyle(ButtonStyle.Secondary)
              )
            );
            await ticketUser.send({ embeds: [dmEmbed], components: [ratingRow] });
          } else {
            await ticketUser.send({ embeds: [dmEmbed] });
          }
        } catch (_) {}
      }

      Logger.ticket('TicketSystem', `Ticket kapatıldı: ${ticket.id} — ${user.tag}`);

    } catch (err) {
      Logger.error('TicketSystem', 'Ticket kapatma hatası', err);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // TICKET SİLME
  // ══════════════════════════════════════════════════════════════

  async handleDeleteButton(interaction) {
    const ticket = db.getTicketByChannel(interaction.channelId);
    if (!ticket) return;

    // Yetki kontrolü
    const settings = db.getGuildSettings(interaction.guild.id);
    const isStaff = settings?.staff_role && interaction.member.roles.cache.has(settings.staff_role);
    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!isStaff && !isAdmin) {
      return interaction.reply({
        embeds: [Embed.error('Yetersiz Yetki', 'Bu işlem için yetkili rolüne sahip olmanız gerekiyor.')],
        ephemeral: true,
      });
    }

    await interaction.deferUpdate();

    db.deleteTicket(ticket.id);

    await interaction.channel.send({
      embeds: [Embed.warning('Kanal Siliniyor', 'Bu kanal 5 saniye içinde silinecek...')],
    });

    setTimeout(async () => {
      try {
        await interaction.channel.delete(`Ticket silindi: ${ticket.id}`);
      } catch (_) {}
    }, 5000);

    Logger.ticket('TicketSystem', `Ticket silindi: ${ticket.id} — ${interaction.user.tag}`);
  }

  // ══════════════════════════════════════════════════════════════
  // TICKET CLAIM
  // ══════════════════════════════════════════════════════════════

  async handleClaimButton(interaction) {
    const ticket = db.getTicketByChannel(interaction.channelId);
    if (!ticket) return;

    const settings = db.getGuildSettings(interaction.guild.id);
    const isStaff = settings?.staff_role && interaction.member.roles.cache.has(settings.staff_role);
    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!isStaff && !isAdmin) {
      return interaction.reply({
        embeds: [Embed.error('Yetersiz Yetki', 'Ticket üstlenmek için yetkili rolüne sahip olmanız gerekiyor.')],
        ephemeral: true,
      });
    }

    if (ticket.claimed_by) {
      return interaction.reply({
        embeds: [Embed.warning('Zaten Üstlenildi', `Bu ticket zaten <@${ticket.claimed_by}> tarafından üstlenildi.`)],
        ephemeral: true,
      });
    }

    db.updateTicket(ticket.id, { claimed_by: interaction.user.id });
    db.updateStaffPerformance(interaction.guild.id, interaction.user.id, 'tickets_claimed');

    await interaction.reply({
      embeds: [Embed.success('Ticket Üstlenildi', `${interaction.user} bu ticket'ı üstlendi.\n\nArtık bu ticket'tan sorumlusunuz.`)],
    });

    Logger.ticket('TicketSystem', `Ticket üstlenildi: ${ticket.id} — ${interaction.user.tag}`);
  }

  async handleUnclaimButton(interaction) {
    const ticket = db.getTicketByChannel(interaction.channelId);
    if (!ticket) return;

    if (ticket.claimed_by !== interaction.user.id) {
      const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
      if (!isAdmin) {
        return interaction.reply({
          embeds: [Embed.error('Yetersiz Yetki', 'Sadece ticket\'ı üstlenen kişi bırakabilir.')],
          ephemeral: true,
        });
      }
    }

    db.updateTicket(ticket.id, { claimed_by: null });

    await interaction.reply({
      embeds: [Embed.info('Ticket Bırakıldı', `${interaction.user} bu ticket'ı bıraktı.`)],
    });
  }

  // ══════════════════════════════════════════════════════════════
  // TICKET REOPEN
  // ══════════════════════════════════════════════════════════════

  async handleReopenButton(interaction) {
    const ticket = db.getTicketByChannel(interaction.channelId);
    if (!ticket) return;

    const settings = db.getGuildSettings(interaction.guild.id);
    const isStaff = settings?.staff_role && interaction.member.roles.cache.has(settings.staff_role);
    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!isStaff && !isAdmin && interaction.user.id !== ticket.user_id) {
      return interaction.reply({
        embeds: [Embed.error('Yetersiz Yetki', 'Bu ticket\'ı yeniden açma yetkiniz yok.')],
        ephemeral: true,
      });
    }

    db.reopenTicket(ticket.id);

    // Kullanıcıya tekrar yazma izni ver
    const ticketUser = await interaction.guild.members.fetch(ticket.user_id).catch(() => null);
    if (ticketUser) {
      await interaction.channel.permissionOverwrites.edit(ticketUser, {
        SendMessages: true,
      });
    }

    await interaction.reply({
      embeds: [Embed.success('Ticket Yeniden Açıldı', `${interaction.user} bu ticket'ı yeniden açtı.`)],
    });

    Logger.ticket('TicketSystem', `Ticket yeniden açıldı: ${ticket.id} — ${interaction.user.tag}`);
  }

  // ══════════════════════════════════════════════════════════════
  // TRANSCRIPT
  // ══════════════════════════════════════════════════════════════

  async handleTranscriptButton(interaction) {
    const ticket = db.getTicketByChannel(interaction.channelId);
    if (!ticket) return;

    await interaction.deferReply({ ephemeral: true });

    try {
      const transcriptFile = await TranscriptSystem.generate(ticket, interaction.channel, interaction.guild);

      if (!transcriptFile) {
        return interaction.editReply({
          embeds: [Embed.error('Hata', 'Transcript oluşturulamadı.')],
        });
      }

      await interaction.editReply({
        embeds: [Embed.success('Transcript Hazır', `Ticket transcript'ı oluşturuldu.`)],
        files: [transcriptFile],
      });
    } catch (err) {
      Logger.error('TicketSystem', 'Transcript hatası', err);
      await interaction.editReply({
        embeds: [Embed.error('Hata', `Transcript oluşturulurken hata: ${err.message}`)],
      });
    }
  }

  // ══════════════════════════════════════════════════════════════
  // RATING
  // ══════════════════════════════════════════════════════════════

  async handleRating(interaction) {
    const parts = interaction.customId.split('_');
    const rating = parseInt(parts[parts.length - 1]);
    const ticketId = parts.slice(2, -1).join('_');

    const ticket = db.getTicket(ticketId);
    if (!ticket) return;

    if (ticket.user_id !== interaction.user.id) {
      return interaction.reply({
        embeds: [Embed.error('Hata', 'Sadece ticket sahibi puanlama yapabilir.')],
        ephemeral: true,
      });
    }

    db.updateTicket(ticketId, { rating });

    const stars = '⭐'.repeat(rating);
    await interaction.update({
      embeds: [Embed.success('Teşekkürler!', `Destek hizmetimizi **${stars}** (${rating}/5) olarak puanladınız.\n\nGeri bildiriminiz için teşekkür ederiz!`)],
      components: [],
    });

    Logger.ticket('TicketSystem', `Ticket puanlandı: ${ticketId} — ${rating}/5`);
  }

  // ══════════════════════════════════════════════════════════════
  // PRIORITY
  // ══════════════════════════════════════════════════════════════

  async handlePrioritySelect(interaction) {
    const ticket = db.getTicketByChannel(interaction.channelId);
    if (!ticket) return;

    const settings = db.getGuildSettings(interaction.guild.id);
    const isStaff = settings?.staff_role && interaction.member.roles.cache.has(settings.staff_role);
    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!isStaff && !isAdmin) {
      return interaction.reply({
        embeds: [Embed.error('Yetersiz Yetki', 'Öncelik değiştirmek için yetkili rolüne sahip olmanız gerekiyor.')],
        ephemeral: true,
      });
    }

    const priorityId = interaction.values[0];
    const priority = config.ticket.priorities.find(p => p.id === priorityId);

    db.updateTicket(ticket.id, { priority: priorityId });

    await interaction.reply({
      embeds: [Embed.success('Öncelik Güncellendi', `Ticket önceliği **${priority.emoji} ${priority.label}** olarak ayarlandı.`)],
    });
  }

  // ══════════════════════════════════════════════════════════════
  // RENAME MODAL
  // ══════════════════════════════════════════════════════════════

  async handleRenameModal(interaction) {
    const ticket = db.getTicketByChannel(interaction.channelId);
    if (!ticket) return;

    const newName = interaction.fields.getTextInputValue('ticket_new_name');
    const sanitized = sanitizeChannelName(newName);

    await interaction.channel.setName(sanitized);
    await interaction.reply({
      embeds: [Embed.success('Yeniden Adlandırıldı', `Ticket kanalı **${sanitized}** olarak yeniden adlandırıldı.`)],
    });
  }

  async handleCloseReasonModal(interaction) {
    const ticket = db.getTicketByChannel(interaction.channelId);
    if (!ticket) return;

    const reason = interaction.fields.getTextInputValue('close_reason');
    await interaction.deferUpdate();
    await this.closeTicket(interaction, ticket, reason);
  }

  // ══════════════════════════════════════════════════════════════
  // AUTO CLOSE (Inactivity)
  // ══════════════════════════════════════════════════════════════

  /**
   * Inactivity timeout kontrolü (her saat çalışır)
   */
  async checkInactivity(client) {
    if (!config.ticket.inactivityTimeout) return;

    const timeoutMs = config.ticket.inactivityTimeout * 60 * 60 * 1000;
    const now = Math.floor(Date.now() / 1000);
    const threshold = now - (config.ticket.inactivityTimeout * 3600);

    // Tüm açık ticketları kontrol et
    // (Tüm guild'ler için)
    for (const guild of client.guilds.cache.values()) {
      const tickets = db.getGuildTickets(guild.id, 'open');

      for (const ticket of tickets) {
        if (ticket.last_activity < threshold) {
          const channel = guild.channels.cache.get(ticket.channel_id);
          if (!channel) continue;

          try {
            await channel.send({
              embeds: [Embed.warning(
                'Hareketsizlik Uyarısı',
                `Bu ticket **${config.ticket.inactivityTimeout} saat** boyunca hareketsiz kaldı.\n\n30 dakika içinde yanıt verilmezse otomatik olarak kapatılacak.`
              )],
            });

            // 30 dakika sonra kapat
            setTimeout(async () => {
              const currentTicket = db.getTicket(ticket.id);
              if (currentTicket?.status === 'open') {
                const fakeInteraction = {
                  guild,
                  channel,
                  user: client.user,
                  channelId: channel.id,
                };
                await this.closeTicket(fakeInteraction, currentTicket, 'Hareketsizlik nedeniyle otomatik kapatıldı');
              }
            }, 30 * 60 * 1000);

          } catch (err) {
            Logger.error('TicketSystem', `Inactivity check hatası: ${ticket.id}`, err);
          }
        }
      }
    }
  }
}

module.exports = new TicketSystem();