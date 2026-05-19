// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - Ana Konfigürasyon Dosyası
// ═══════════════════════════════════════════════════════════════

module.exports = {
  // ── Bot Genel Ayarları ──────────────────────────────────────
  bot: {
    name: 'MeteTicket',
    version: '2.0.0',
    prefix: process.env.PREFIX || '!',
    defaultLanguage: 'tr',
    supportServer: 'https://discord.gg/example',
    website: 'https://meteticket.xyz',
  },

  // ── Renk Paleti ────────────────────────────────────────────
  colors: {
    primary:   0x5865F2, // Discord Blurple
    success:   0x57F287, // Yeşil
    error:     0xED4245, // Kırmızı
    warning:   0xFEE75C, // Sarı
    info:      0x5865F2, // Mavi
    ticket:    0x5865F2, // Ticket rengi
    mod:       0xEB459E, // Moderasyon rengi
    guard:     0xFEE75C, // Guard rengi
    log:       0x99AAB5, // Log rengi
    invisible: 0x2B2D31, // Görünmez (embed bg rengi)
    gold:      0xF1C40F, // Altın
    purple:    0x9B59B6, // Mor
    orange:    0xE67E22, // Turuncu
    cyan:      0x1ABC9C, // Cyan
  },

  // ── Emoji Seti ─────────────────────────────────────────────
  emojis: {
    // Durum emojileri
    success:    '✅',
    error:      '❌',
    warning:    '⚠️',
    info:       'ℹ️',
    loading:    '⏳',
    check:      '☑️',
    cross:      '✖️',
    dot:        '•',
    arrow:      '➜',
    star:       '⭐',
    crown:      '👑',
    shield:     '🛡️',
    lock:       '🔒',
    unlock:     '🔓',
    ticket:     '🎫',
    tools:      '🔧',
    ban:        '🔨',
    kick:       '👢',
    mute:       '🔇',
    warn:       '⚠️',
    log:        '📋',
    transcript: '📄',
    stats:      '📊',
    time:       '⏰',
    user:       '👤',
    role:       '🎭',
    channel:    '📢',
    server:     '🏠',
    ping:       '🏓',
    bot:        '🤖',
    mail:       '📧',
    fire:       '🔥',
    gem:        '💎',
    lightning:  '⚡',
    heart:      '❤️',
    music:      '🎵',
    gift:       '🎁',
    trophy:     '🏆',
    chart:      '📈',
    search:     '🔍',
    settings:   '⚙️',
    trash:      '🗑️',
    edit:       '✏️',
    add:        '➕',
    remove:     '➖',
    refresh:    '🔄',
    link:       '🔗',
    priority: {
      low:      '🟢',
      medium:   '🟡',
      high:     '🔴',
      urgent:   '🚨',
    },
  },

  // ── Ticket Sistemi ─────────────────────────────────────────
  ticket: {
    // Ticket kanal adı formatı: ticket-{username}-{id}
    channelNameFormat: 'ticket-{username}',
    maxTicketsPerUser: 3,
    autoCloseTime: 48, // saat (0 = devre dışı)
    inactivityTimeout: 24, // saat (0 = devre dışı)
    cooldown: 300, // saniye (5 dakika)
    transcriptEnabled: true,
    ratingEnabled: true,
    claimEnabled: true,
    priorityEnabled: true,
    tagsEnabled: true,

    // Ticket kategorileri
    // buttonLabel: butonda gorunecek kisa isim (max 20 karakter)
    // buttonStyle: 'primary' (mavi) | 'success' (yesil) | 'danger' (kirmizi) | 'secondary' (gri)
    categories: [
      {
        id: 'destek',
        label: 'Destek, Bug & Teknik Sorunlar',
        description: 'Teknik problemler, site/panel hatalari ve genel destek talepleri icin acin.',
        emoji: '🔧',
        buttonLabel: 'Destek',
        buttonStyle: 'primary',
        color: 0x5865F2,
      },
      {
        id: 'satis',
        label: 'Satis & Odeme Islemleri',
        description: 'Urun satin alimi, odeme bildirimleri ve fatura islemleri icin acin.',
        emoji: '💳',
        buttonLabel: 'Satis',
        buttonStyle: 'primary',
        color: 0x57F287,
      },
      {
        id: 'sunucu',
        label: 'VPS & Sunucu Destek',
        description: 'VPS, VDS, dedicated ve hosting sunucularinizla ilgili destek almak icin acin.',
        emoji: '🖥️',
        buttonLabel: 'Sunucu',
        buttonStyle: 'primary',
        color: 0xFEE75C,
      },
      {
        id: 'partnerlik',
        label: 'Partnerlik & Diger Talepler',
        description: 'Is ortakligi, ozel teklifler ve diger tum konular icin acin.',
        emoji: '✉️',
        buttonLabel: 'Partnerlik',
        buttonStyle: 'danger',
        color: 0xED4245,
      },
    ],

    // Öncelik seviyeleri
    priorities: [
      { id: 'low',    label: 'Düşük',   emoji: '🟢', color: 0x57F287 },
      { id: 'medium', label: 'Orta',    emoji: '🟡', color: 0xFEE75C },
      { id: 'high',   label: 'Yüksek',  emoji: '🔴', color: 0xED4245 },
      { id: 'urgent', label: 'Acil',    emoji: '🚨', color: 0xFF0000 },
    ],
  },

  // ── Moderasyon Sistemi ─────────────────────────────────────
  moderation: {
    muteRoleName: 'Muted',
    jailRoleName: 'Jailed',
    jailChannelName: 'jail',
    warnThresholds: {
      3: 'mute:1h',
      5: 'mute:24h',
      7: 'kick',
      10: 'ban',
    },
    defaultMuteDuration: '1h',
    maxWarnPoints: 10,
    dmOnPunishment: true,
    logEnabled: true,
  },

  // ── Guard Sistemi ──────────────────────────────────────────
  guard: {
    enabled: true,
    // Kaç işlem yapılırsa tetiklensin
    thresholds: {
      channelDelete: 3,
      channelCreate: 5,
      roleDelete: 3,
      roleCreate: 5,
      memberBan: 3,
      memberKick: 5,
      webhookCreate: 3,
      emojiDelete: 5,
    },
    // Tetiklenme süresi (saniye)
    timeWindow: 10,
    // Ceza türü: 'ban' | 'kick' | 'removeRoles'
    punishment: 'ban',
    // Rollback: silinen kanalları/rolleri geri yükle
    rollback: true,
  },

  // ── Log Sistemi ────────────────────────────────────────────
  logs: {
    messageDelete: true,
    messageEdit: true,
    memberJoin: true,
    memberLeave: true,
    memberBan: true,
    memberUnban: true,
    roleCreate: true,
    roleDelete: true,
    roleUpdate: true,
    channelCreate: true,
    channelDelete: true,
    channelUpdate: true,
    voiceStateUpdate: true,
    guildUpdate: true,
    emojiCreate: true,
    emojiDelete: true,
    inviteCreate: true,
    inviteDelete: true,
  },

  // ── Cooldown Ayarları ──────────────────────────────────────
  cooldowns: {
    default: 3,      // saniye
    moderation: 5,   // saniye
    ticket: 300,     // saniye (5 dakika)
    info: 10,        // saniye
  },

  // ── Anti-Spam Ayarları ─────────────────────────────────────
  antiSpam: {
    enabled: true,
    maxMessages: 5,
    timeWindow: 5000, // ms
    punishment: 'mute',
    muteDuration: '10m',
  },

  // ── Dil Desteği ────────────────────────────────────────────
  languages: ['tr', 'en'],

  // ── Database Ayarları ──────────────────────────────────────
  database: {
    path: './data/database.sqlite',
    backupEnabled: true,
    backupInterval: 3600000, // 1 saat (ms)
    backupPath: './data/backups/',
  },

  // ── Transcript Ayarları ────────────────────────────────────
  transcript: {
    enabled: true,
    format: 'html', // 'html' | 'txt'
    savePath: './data/transcripts/',
    maxAge: 30, // gün
  },
};