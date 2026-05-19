// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - Premium Embed Builder (Components V2)
// ═══════════════════════════════════════════════════════════════

const {
  EmbedBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SectionBuilder,
  ThumbnailBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} = require('discord.js');
const config = require('../config/config');

// ── Yardimci: Components V2 mesaj options olusturur ─────────────
function v2Message(container) {
  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  };
}

class PremiumEmbed {

  // ══════════════════════════════════════════════════════════════
  // TEMEL EMBED'LER (ephemeral reply'lar icin klasik EmbedBuilder)
  // ══════════════════════════════════════════════════════════════

  static success(title, description, options = {}) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setDescription(`${config.emojis.success} **${title}**\n\n${description}`)
      .setTimestamp();
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.image) embed.setImage(options.image);
    if (options.footer) embed.setFooter({ text: options.footer, iconURL: options.footerIcon });
    if (options.author) embed.setAuthor({ name: options.author, iconURL: options.authorIcon });
    if (options.fields) embed.addFields(options.fields);
    return embed;
  }

  static error(title, description, options = {}) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.error)
      .setDescription(`${config.emojis.error} **${title}**\n\n${description}`)
      .setTimestamp();
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.footer) embed.setFooter({ text: options.footer, iconURL: options.footerIcon });
    if (options.author) embed.setAuthor({ name: options.author, iconURL: options.authorIcon });
    if (options.fields) embed.addFields(options.fields);
    return embed;
  }

  static warning(title, description, options = {}) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setDescription(`${config.emojis.warning} **${title}**\n\n${description}`)
      .setTimestamp();
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.footer) embed.setFooter({ text: options.footer, iconURL: options.footerIcon });
    if (options.author) embed.setAuthor({ name: options.author, iconURL: options.authorIcon });
    if (options.fields) embed.addFields(options.fields);
    return embed;
  }

  static info(title, description, options = {}) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.info)
      .setDescription(`${config.emojis.info} **${title}**\n\n${description}`)
      .setTimestamp();
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.footer) embed.setFooter({ text: options.footer, iconURL: options.footerIcon });
    if (options.author) embed.setAuthor({ name: options.author, iconURL: options.authorIcon });
    if (options.fields) embed.addFields(options.fields);
    return embed;
  }

  static premium(options = {}) {
    const embed = new EmbedBuilder()
      .setColor(options.color || config.colors.primary)
      .setTimestamp();
    if (options.title) embed.setTitle(options.title);
    if (options.description) embed.setDescription(options.description);
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.image) embed.setImage(options.image);
    if (options.fields) embed.addFields(options.fields);
    if (options.footer) embed.setFooter({ text: options.footer, iconURL: options.footerIcon });
    if (options.author) embed.setAuthor({ name: options.author, iconURL: options.authorIcon, url: options.authorUrl });
    if (options.url) embed.setURL(options.url);
    return embed;
  }

  // ══════════════════════════════════════════════════════════════
  // COMPONENTS V2 - TICKET PANEL
  // ══════════════════════════════════════════════════════════════

  /**
   * Ticket panel - Components V2 ContainerBuilder
   * Fotodaki gibi: baslik, aciklama, kategori satirlari
   * Butonlar ayri olarak TicketSystem.sendPanel tarafindan eklenir
   */
  /**
   * Ticket panel - Components V2 ContainerBuilder
   * Fotodaki gibi:
   *   - Baslik + thumbnail (SectionBuilder)
   *   - Banner resim (MediaGalleryBuilder) - varsa
   *   - Her kategori = SectionBuilder (text sol, buton sag)
   *   - Footer
   * buttonRows parametresi ARTIK KULLANILMIYOR - butonlar Section icinde
   */
  static ticketPanel(guild, panelSettings = {}) {
    const settings = panelSettings || {};

    let color = config.colors.ticket;
    if (settings.panel_color) {
      try { color = parseInt(settings.panel_color.replace('#', ''), 16); } catch (_) {}
    }

    const title = settings.panel_title || `${guild.name} | Destek Sistemi`;
    const desc = settings.panel_description ||
      'Asagidaki basliklardan konunuza en yakin olani secerek hizlica ticket olusturabilirsiniz.';
    const footer = settings.panel_footer || `${guild.name} | Ticket Sistemi`;
    const thumbnail = settings.panel_thumbnail || guild.iconURL({ dynamic: true, size: 256 });
    const bannerImage = settings.panel_image || null;

    const container = new ContainerBuilder().setAccentColor(color);

    // ── 1. Baslik + thumbnail ───────────────────────────────────
    // SectionBuilder ZORUNLU olarak bir accessory (thumbnail veya button) gerektiriyor.
    // Thumbnail gecerli URL varsa SectionBuilder, yoksa TextDisplayBuilder kullan.
    const safeThumb = thumbnail && typeof thumbnail === 'string' && thumbnail.startsWith('http') ? thumbnail : null;

    if (safeThumb) {
      const headerSection = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## ${title}\n✦ **Destek Sistemi Hakkinda**\n> ${desc}`
          )
        )
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(safeThumb));
      container.addSectionComponents(headerSection);
    } else {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## ${title}\n✦ **Destek Sistemi Hakkinda**\n> ${desc}`
        )
      );
    }

    // ── 2. Ayirici ──────────────────────────────────────────────
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));

    // ── 3. Her kategori = SectionBuilder (text + buton) ─────────
    const cats = config.ticket.categories;
    for (const cat of cats) {
      let style = ButtonStyle.Secondary;
      if (cat.buttonStyle === 'primary') style = ButtonStyle.Primary;
      else if (cat.buttonStyle === 'danger') style = ButtonStyle.Danger;
      else if (cat.buttonStyle === 'success') style = ButtonStyle.Success;

      const btn = new ButtonBuilder()
        .setCustomId(`ticket_create_${cat.id}`)
        .setLabel((cat.buttonLabel || cat.label).slice(0, 80))
        .setStyle(style);

      const catSection = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${cat.emoji} **${cat.label}**\n${cat.description}`
          )
        )
        .setButtonAccessory(btn);

      container.addSectionComponents(catSection);
    }

    // ── 4. Footer ───────────────────────────────────────────────
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(false));
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ${footer}`)
    );

    return container;
  }

  /**
   * ticketPanel mesaj options'i (IS_COMPONENTS_V2 flag ile)
   * Butonlar artik Section icinde - buttonRows parametresi geriye donuk uyumluluk icin tutuldu
   */
  static ticketPanelMessage(guild, panelSettings, buttonRows = []) {
    const container = PremiumEmbed.ticketPanel(guild, panelSettings);
    // Butonlar Section icinde oldugu icin buttonRows eklenmez
    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    };
  }

  // ══════════════════════════════════════════════════════════════
  // COMPONENTS V2 - TICKET ACILIS
  // ══════════════════════════════════════════════════════════════

  /**
   * Ticket acilis mesaji - Components V2
   * Fotodaki gibi: "Destek Talebi #002", kullanici avatar, bilgiler, durum
   */
  static ticketOpenMessage(ticket, user, category, settings = {}, controlRow, priorityRow) {
    const ticketNum = ticket.id ? `#${String(ticket.id).padStart(3, '0')}` : '#001';
    const catLabel = category?.label || ticket.category || 'Genel';
    const catEmoji = category?.emoji || '🎫';
    const footer = settings.panel_footer || `${config.bot.name} | Ticket Sistemi`;

    let color = config.colors.ticket;
    if (category?.color) {
      try { color = typeof category.color === 'number' ? category.color : parseInt(String(category.color).replace('#', ''), 16); } catch (_) {}
    }

    const now = Math.floor(Date.now() / 1000);
    const staffMention = settings.staff_role ? `<@&${settings.staff_role}>` : 'Yetkili';

    const container = new ContainerBuilder().setAccentColor(color);

    // Baslik + aciklama (SectionBuilder olmadan, sadece TextDisplay)
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## 🎫 Destek Talebi ${ticketNum}\n` +
        `${user} tarafindan destek talebi **<t:${now}:d> <t:${now}:t>** tarihinde olusturuldu. Sahiplenen ${user}.`
      )
    );

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));

    // Destek Bilgileri
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Destek Bilgileri**\n` +
        `➜ **Destek ID:** \`${ticketNum}\`\n` +
        `➜ **Destek Kategorisi:** \`${catEmoji} ${catLabel}\`\n` +
        `➜ **Ortalama Yanit Suresi:** \`Bekleniyor\`\n` +
        `➜ ${user} & ${staffMention} · Yetkili`
      )
    );

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(false));

    // Destek Durumu
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Destek Durumu**\n\`\`\`\nBeklemede\n\`\`\``
      )
    );

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(false));

    // Footer
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ${footer}`)
    );

    const components = [container];
    if (controlRow) components.push(controlRow);
    if (priorityRow) components.push(priorityRow);

    return {
      components,
      flags: MessageFlags.IsComponentsV2,
    };
  }

  // ══════════════════════════════════════════════════════════════
  // COMPONENTS V2 - LOG MESAJLARI
  // ══════════════════════════════════════════════════════════════

  /**
   * Ticket log mesaji - Components V2
   */
  static ticketLogMessage(type, data = {}) {
    const footer = data.footer || `${config.bot.name} | Log Sistemi`;

    const typeMap = {
      ticket_open:  { color: config.colors.success, title: 'Ticket Acildi',           desc: 'Yeni bir destek talebi olusturuldu.' },
      ticket_close: { color: config.colors.error,   title: 'Ticket Kapatildi',        desc: 'Bir destek talebi kapatildi.' },
      ticket_claim: { color: config.colors.info,    title: 'Ticket Sahiplenildi',     desc: 'Bir yetkili destek talebini sahiplendi.' },
      transcript:   { color: config.colors.log,     title: 'Ticket Arsivi (Transcript)', desc: 'Kapatilan ticketin HTML dokumu ektedir.' },
      panel_sent:   { color: config.colors.success, title: 'Ticket Paneli Gonderildi', desc: 'Ticket paneli bir kanala gonderildi.' },
      panel_edit:   { color: config.colors.warning, title: 'Ticket Paneli Duzenlendi', desc: 'Panel kategori satirlari guncellendi.' },
    };

    const cfg = typeMap[type] || { color: config.colors.log, title: type, desc: '' };

    const container = new ContainerBuilder().setAccentColor(cfg.color);

    // Baslik + aciklama
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`**${cfg.title}**\n> ${cfg.desc}`)
    );

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));

    // Field'lar
    const lines = [];

    if (data.ticketId) {
      const ch = data.channel ? `# ${data.channel.name || data.channel}` : '# bilinmeyen';
      lines.push(`**Ticket:** ${data.ticketId} - ${ch}`);
    }
    if (data.user) lines.push(`**Acan:** ${data.user}`);
    if (data.closer) lines.push(`**Kapatan:** ${data.closer}`);
    if (data.claimer) lines.push(`**Sahiplenen:** ${data.claimer}`);
    if (data.channel && !data.ticketId) lines.push(`**Panel Kanali:** # ${data.channel.name || data.channel}`);
    if (data.executor) lines.push(`**${type === 'panel_sent' ? 'Gonderen' : 'Duzenleyen'}:** ${data.executor}`);
    if (data.guildId) lines.push(`ID: ${data.guildId}`);
    if (data.catCount !== undefined) lines.push(`**Kategori Sayisi:** ${data.catCount}`);
    if (data.panelMsg) lines.push(`**Panel Mesaji:** ${data.panelMsg}`);
    if (data.category) lines.push(`**Kategori:** ${data.categoryEmoji || ''} ${data.category}`);
    if (data.filename) lines.push(`📄 **Dosya:** \`${data.filename}\``);

    if (lines.length > 0) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(lines.join('\n'))
      );
    }

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(false));
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ${footer}`)
    );

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    };
  }

  /**
   * Sahiplenildi bilgi mesaji - Components V2
   */
  static ticketClaimMessage(claimer, ticket, settings = {}) {
    const footer = settings.panel_footer || `${config.bot.name} | Ticket Sistemi`;
    const container = new ContainerBuilder().setAccentColor(config.colors.info);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Bilgi**\n> Bu ticket ${claimer} tarafindan sahiplenildi.`
      )
    );
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(false));
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# <t:${Math.floor(Date.now() / 1000)}:F>`)
    );

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    };
  }

  // ══════════════════════════════════════════════════════════════
  // COMPONENTS V2 - GENEL LOG
  // ══════════════════════════════════════════════════════════════

  static logMessage(title, description, color = null, fields = []) {
    const container = new ContainerBuilder().setAccentColor(color || config.colors.log);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`**${title}**\n> ${description}`)
    );

    if (fields.length > 0) {
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
      const lines = fields.map(f => `**${f.name}** ${f.value}`).join('\n');
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(lines)
      );
    }

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(false));
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ${config.bot.name} | Log Sistemi`)
    );

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    };
  }

  // ══════════════════════════════════════════════════════════════
  // KLASIK EMBED'LER (geriye donuk uyumluluk)
  // ══════════════════════════════════════════════════════════════

  static ticketPanel_legacy(guild, panelSettings = {}) {
    const settings = panelSettings || {};
    let color = config.colors.ticket;
    if (settings.panel_color) {
      try { color = parseInt(settings.panel_color.replace('#', ''), 16); } catch (_) {}
    }
    const title = settings.panel_title || `${guild.name} | Destek Sistemi`;
    const desc = settings.panel_description || 'Asagidaki basliklardan konunuza en yakin olani secerek hizlica ticket olusturabilirsiniz.';
    const footer = settings.panel_footer || `${guild.name} | Ticket Sistemi`;
    const thumbnail = settings.panel_thumbnail || guild.iconURL({ dynamic: true, size: 256 });
    const catLines = config.ticket.categories.map(c => `${c.emoji} **${c.label}**\n${c.description}`).join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .setDescription(`✦ **Destek Sistemi Hakkinda**\n> ${desc}\n\u200b`)
      .setFooter({ text: footer, iconURL: guild.iconURL({ dynamic: true }) });

    if (thumbnail) embed.setThumbnail(thumbnail);
    if (settings.panel_image) embed.setImage(settings.panel_image);
    if (catLines) embed.addFields({ name: '\u200b', value: catLines, inline: false });

    return embed;
  }

  static ticketOpen(ticket, user, category, settings = {}) {
    const ticketNum = ticket.id ? `#${String(ticket.id).padStart(3, '0')}` : '#001';
    const catLabel = category?.label || ticket.category || 'Genel';
    const catEmoji = category?.emoji || '🎫';
    const color = category?.color ? (typeof category.color === 'number' ? category.color : parseInt(String(category.color).replace('#', ''), 16)) : config.colors.ticket;
    const footer = settings.panel_footer || `${config.bot.name} | Ticket Sistemi`;
    const now = Math.floor(Date.now() / 1000);

    return new EmbedBuilder()
      .setColor(color)
      .setTitle(`🎫 Destek Talebi ${ticketNum}`)
      .setDescription(`${user} tarafindan destek talebi **<t:${now}:d> <t:${now}:t>** tarihinde olusturuldu. Sahiplenen ${user}.`)
      .addFields(
        { name: '**Destek Bilgileri**', value: [`➜ **Destek ID:** \`${ticketNum}\``, `➜ **Destek Kategorisi:** \`${catEmoji} ${catLabel}\``, `➜ **Ortalama Yanit Suresi:** \`Bekleniyor\``, `➜ ${user} & <@&${settings.staff_role || '0'}> · Yetkili`].join('\n'), inline: false },
        { name: '**Destek Durumu**', value: '```\nBeklemede\n```', inline: false }
      )
      .setThumbnail(user.displayAvatarURL?.({ dynamic: true, size: 256 }) || null)
      .setFooter({ text: footer })
      .setTimestamp();
  }

  static modLog(action, target, moderator, reason, caseId, extra = {}) {
    const actionColors = { ban: config.colors.error, kick: config.colors.warning, mute: config.colors.warning, warn: config.colors.warning, unban: config.colors.success, unmute: config.colors.success, slowmode: config.colors.info, lock: config.colors.warning, unlock: config.colors.success, clear: config.colors.info };
    const actionEmojis = { ban: '🔨', kick: '👢', mute: '🔇', warn: '⚠️', unban: '✅', unmute: '🔊', slowmode: '🐢', lock: '🔒', unlock: '🔓', clear: '🗑️' };

    const embed = new EmbedBuilder()
      .setColor(actionColors[action] || config.colors.mod)
      .setTitle(`${actionEmojis[action] || '🛡️'} ${action.toUpperCase()} | Vaka #${caseId}`)
      .setDescription(`> Moderasyon islemi gerceklestirildi.`)
      .addFields(
        { name: '**Hedef:**', value: `${target.tag || target} (${target.id || target})`, inline: false },
        { name: '**Moderator:**', value: `${moderator.tag || moderator} (${moderator.id || moderator})`, inline: false },
        { name: '**Sebep:**', value: reason || 'Belirtilmedi', inline: false },
      )
      .setThumbnail(target.displayAvatarURL?.({ dynamic: true }) || null)
      .setFooter({ text: `${config.bot.name} | Log Sistemi` })
      .setTimestamp();

    if (extra.duration) embed.addFields({ name: '**Sure:**', value: extra.duration, inline: false });
    if (extra.expires) embed.addFields({ name: '**Bitis:**', value: `<t:${extra.expires}:R>`, inline: false });
    if (extra.channel) embed.addFields({ name: '**Kanal:**', value: `${extra.channel}`, inline: false });
    return embed;
  }

  static guardLog(action, executor, details, punishment) {
    return new EmbedBuilder()
      .setColor(config.colors.guard)
      .setTitle(`🛡️ GUARD UYARISI — ${action.toUpperCase()}`)
      .setDescription(`> **Supheli aktivite tespit edildi!**\n\n${details}`)
      .addFields(
        { name: '**Kullanici:**', value: `${executor.tag || executor} (${executor.id || executor})`, inline: false },
        { name: '**Ceza:**', value: punishment || 'Yok', inline: false },
      )
      .setThumbnail(executor.displayAvatarURL?.({ dynamic: true }) || null)
      .setFooter({ text: `${config.bot.name} | Guard Sistemi` })
      .setTimestamp();
  }

  static log(title, description, color = null, fields = []) {
    const embed = new EmbedBuilder()
      .setColor(color || config.colors.log)
      .setTitle(title)
      .setDescription(`> ${description}`)
      .setFooter({ text: `${config.bot.name} | Log Sistemi` })
      .setTimestamp();
    if (fields.length > 0) embed.addFields(fields);
    return embed;
  }

  static userInfo(member, user) {
    const roles = member.roles.cache.filter(r => r.id !== member.guild.id).sort((a, b) => b.position - a.position).map(r => `${r}`).slice(0, 10);
    return new EmbedBuilder()
      .setColor(member.displayHexColor || config.colors.primary)
      .setTitle(`👤 Kullanici Bilgisi`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '👤 Kullanici', value: `${user.tag}`, inline: true },
        { name: '🆔 ID', value: user.id, inline: true },
        { name: '🤖 Bot', value: user.bot ? 'Evet' : 'Hayir', inline: true },
        { name: '📅 Hesap Olusturma', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: true },
        { name: '📥 Sunucuya Katilma', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: true },
        { name: '🎭 En Yuksek Rol', value: `${member.roles.highest}`, inline: true },
        { name: `🎭 Roller (${roles.length})`, value: roles.length > 0 ? roles.join(' ') : 'Yok', inline: false },
      )
      .setFooter({ text: `ID: ${user.id}` })
      .setTimestamp();
  }

  static serverInfo(guild) {
    const channels = guild.channels.cache;
    return new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`🏠 Sunucu Bilgisi`)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '🏠 Sunucu Adi', value: guild.name, inline: true },
        { name: '🆔 ID', value: guild.id, inline: true },
        { name: '👑 Sahip', value: `<@${guild.ownerId}>`, inline: true },
        { name: '👥 Uye Sayisi', value: `${guild.memberCount}`, inline: true },
        { name: '🎭 Rol Sayisi', value: `${guild.roles.cache.size}`, inline: true },
        { name: '📢 Kanal Sayisi', value: `Metin: ${channels.filter(c => c.type === 0).size} | Ses: ${channels.filter(c => c.type === 2).size}`, inline: true },
        { name: '📅 Olusturulma', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
        { name: '💎 Boost', value: `Seviye ${guild.premiumTier} (${guild.premiumSubscriptionCount} boost)`, inline: true },
      )
      .setImage(guild.bannerURL({ size: 1024 }) || null)
      .setFooter({ text: `ID: ${guild.id}` })
      .setTimestamp();
  }

  static ping(wsLatency, apiLatency) {
    const getStatus = (ms) => ms < 100 ? `${config.emojis.success} Mukemmel` : ms < 200 ? `${config.emojis.warning} Iyi` : `${config.emojis.error} Kotu`;
    return new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`🏓 Ping Bilgisi`)
      .addFields(
        { name: '🌐 WebSocket', value: `\`${wsLatency}ms\` ${getStatus(wsLatency)}`, inline: true },
        { name: '📡 API', value: `\`${apiLatency}ms\` ${getStatus(apiLatency)}`, inline: true },
      )
      .setTimestamp();
  }
}

module.exports = PremiumEmbed;