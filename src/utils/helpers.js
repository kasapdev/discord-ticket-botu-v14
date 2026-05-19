// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - Yardımcı Fonksiyonlar
// ═══════════════════════════════════════════════════════════════

const ms = require('ms');

/**
 * Süreyi okunabilir formata çevirir
 * @param {number} ms - Milisaniye
 * @returns {string}
 */
function formatDuration(milliseconds) {
  if (!milliseconds || milliseconds <= 0) return 'Süresiz';
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} gün ${hours % 24} saat`;
  if (hours > 0) return `${hours} saat ${minutes % 60} dakika`;
  if (minutes > 0) return `${minutes} dakika ${seconds % 60} saniye`;
  return `${seconds} saniye`;
}

/**
 * Süre string'ini ms'ye çevirir
 * @param {string} duration - Örn: "1h", "30m", "7d"
 * @returns {number|null}
 */
function parseDuration(duration) {
  if (!duration) return null;
  try {
    const result = ms(duration);
    return result || null;
  } catch {
    return null;
  }
}

/**
 * Unix timestamp'i Discord timestamp formatına çevirir
 * @param {number} timestamp - Unix timestamp (saniye)
 * @param {string} style - 't'|'T'|'d'|'D'|'f'|'F'|'R'
 * @returns {string}
 */
function discordTimestamp(timestamp, style = 'f') {
  const ts = typeof timestamp === 'number' ? timestamp : Math.floor(timestamp / 1000);
  return `<t:${ts}:${style}>`;
}

/**
 * Şu anki Unix timestamp'i döndürür
 * @returns {number}
 */
function now() {
  return Math.floor(Date.now() / 1000);
}

/**
 * Kullanıcı mention'ı oluşturur
 * @param {string} userId
 * @returns {string}
 */
function userMention(userId) {
  return `<@${userId}>`;
}

/**
 * Kanal mention'ı oluşturur
 * @param {string} channelId
 * @returns {string}
 */
function channelMention(channelId) {
  return `<#${channelId}>`;
}

/**
 * Rol mention'ı oluşturur
 * @param {string} roleId
 * @returns {string}
 */
function roleMention(roleId) {
  return `<@&${roleId}>`;
}

/**
 * String'i belirli uzunlukta keser
 * @param {string} str
 * @param {number} maxLength
 * @param {string} suffix
 * @returns {string}
 */
function truncate(str, maxLength = 100, suffix = '...') {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Kanal adı için güvenli string oluşturur
 * @param {string} str
 * @returns {string}
 */
function sanitizeChannelName(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

/**
 * Rastgele ID oluşturur
 * @param {number} length
 * @returns {string}
 */
function generateId(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Sayıyı formatlar (1000 -> 1,000)
 * @param {number} num
 * @returns {string}
 */
function formatNumber(num) {
  return num?.toLocaleString('tr-TR') || '0';
}

/**
 * Yüzde hesaplar
 * @param {number} value
 * @param {number} total
 * @returns {string}
 */
function percentage(value, total) {
  if (!total) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

/**
 * Progress bar oluşturur
 * @param {number} value
 * @param {number} max
 * @param {number} length
 * @returns {string}
 */
function progressBar(value, max, length = 10) {
  const filled = Math.round((value / max) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Kullanıcı adını güvenli hale getirir (markdown escape)
 * @param {string} str
 * @returns {string}
 */
function escapeMarkdown(str) {
  if (!str) return '';
  return str.replace(/[*_`~|\\]/g, '\\$&');
}

/**
 * Chunk array'i parçalara böler
 * @param {Array} array
 * @param {number} size
 * @returns {Array[]}
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Nesneyi deep clone eder
 * @param {Object} obj
 * @returns {Object}
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Async sleep
 * @param {number} ms
 * @returns {Promise}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry mekanizması
 * @param {Function} fn
 * @param {number} retries
 * @param {number} delay
 * @returns {Promise}
 */
async function retry(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(delay * (i + 1));
    }
  }
}

/**
 * Kullanıcının en yüksek rolünü döndürür
 * @param {GuildMember} member
 * @returns {Role}
 */
function getHighestRole(member) {
  return member.roles.highest;
}

/**
 * İki üyenin hiyerarşisini karşılaştırır
 * @param {GuildMember} executor
 * @param {GuildMember} target
 * @returns {boolean} executor > target ise true
 */
function canModerate(executor, target) {
  if (target.id === target.guild.ownerId) return false;
  if (executor.id === executor.guild.ownerId) return true;
  return executor.roles.highest.position > target.roles.highest.position;
}

/**
 * Tarih formatlar
 * @param {Date|number} date
 * @returns {string}
 */
function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date * 1000);
  return d.toLocaleDateString('tr-TR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Hesap yaşını hesaplar
 * @param {Date} createdAt
 * @returns {string}
 */
function accountAge(createdAt) {
  const diff = Date.now() - createdAt.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 30) return `${days} gün`;
  if (days < 365) return `${Math.floor(days / 30)} ay`;
  return `${Math.floor(days / 365)} yıl`;
}

/**
 * Ticket ID oluşturur
 * @param {string} guildId
 * @returns {string}
 */
function generateTicketId(guildId) {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `TKT-${timestamp}-${random}`;
}

module.exports = {
  formatDuration,
  parseDuration,
  discordTimestamp,
  now,
  userMention,
  channelMention,
  roleMention,
  truncate,
  sanitizeChannelName,
  generateId,
  formatNumber,
  percentage,
  progressBar,
  escapeMarkdown,
  chunkArray,
  deepClone,
  sleep,
  retry,
  getHighestRole,
  canModerate,
  formatDate,
  accountAge,
  generateTicketId,
};