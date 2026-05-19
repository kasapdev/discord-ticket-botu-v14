// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - sql.js Database Manager (Pure JS, No Build Tools)
// ═══════════════════════════════════════════════════════════════

const path = require('path');
const fs = require('fs');
const config = require('../config/config');
const Logger = require('../utils/Logger');

class DatabaseManager {
  constructor() {
    this.db = null;
    this.SQL = null;
    this.dbPath = path.resolve(config.database.path);
    this._ensureDir();
    this._init();
  }

  _ensureDir() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const transcriptDir = path.resolve(config.transcript.savePath);
    if (!fs.existsSync(transcriptDir)) fs.mkdirSync(transcriptDir, { recursive: true });

    const backupDir = path.resolve(config.database.backupPath);
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  }

  async _init() {
    try {
      const initSqlJs = require('sql.js');
      this.SQL = await initSqlJs();

      // Load existing database or create new
      if (fs.existsSync(this.dbPath)) {
        const fileBuffer = fs.readFileSync(this.dbPath);
        this.db = new this.SQL.Database(fileBuffer);
      } else {
        this.db = new this.SQL.Database();
      }

      this._createTables();
      this._setupAutoSave();
      this._setupBackup();

      Logger.success('Database', `sql.js database hazır: ${this.dbPath}`);
    } catch (err) {
      Logger.error('Database', `Database başlatılamadı: ${err.message}`, err);
      process.exit(1);
    }
  }

  // Save database to file
  _save() {
    try {
      if (!this.db) return;
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    } catch (err) {
      Logger.error('Database', `Kaydetme hatası: ${err.message}`);
    }
  }

  _setupAutoSave() {
    // Auto-save every 30 seconds
    setInterval(() => this._save(), 30000);
  }

  _setupBackup() {
    if (!config.database.backupEnabled) return;
    setInterval(() => this.backup(), config.database.backupInterval);
  }

  backup() {
    try {
      this._save();
      const backupDir = path.resolve(config.database.backupPath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `backup-${timestamp}.sqlite`);
      fs.copyFileSync(this.dbPath, backupPath);
      Logger.info('Database', `Backup alındı: ${backupPath}`);

      // Clean old backups (>7 days)
      const files = fs.readdirSync(backupDir);
      const now = Date.now();
      files.forEach(file => {
        const filePath = path.join(backupDir, file);
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > 7 * 24 * 60 * 60 * 1000) {
          fs.unlinkSync(filePath);
        }
      });
    } catch (err) {
      Logger.error('Database', `Backup hatası: ${err.message}`);
    }
  }

  _createTables() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS guild_settings (
        guild_id TEXT PRIMARY KEY,
        log_channel TEXT,
        mod_log_channel TEXT,
        ticket_log_channel TEXT,
        guard_log_channel TEXT,
        transcript_channel TEXT,
        ticket_category TEXT,
        staff_role TEXT,
        mute_role TEXT,
        jail_role TEXT,
        jail_channel TEXT,
        welcome_channel TEXT,
        leave_channel TEXT,
        guard_enabled INTEGER DEFAULT 1,
        anti_spam_enabled INTEGER DEFAULT 1,
        language TEXT DEFAULT 'tr',
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        priority TEXT DEFAULT 'medium',
        claimed_by TEXT,
        subject TEXT,
        tags TEXT DEFAULT '[]',
        rating INTEGER,
        rating_comment TEXT,
        message_count INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        closed_at INTEGER,
        deleted_at INTEGER,
        last_activity INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS ticket_participants (
        ticket_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        added_by TEXT NOT NULL,
        added_at INTEGER DEFAULT (strftime('%s', 'now')),
        PRIMARY KEY (ticket_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS ticket_messages (
        id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        avatar TEXT,
        content TEXT,
        attachments TEXT DEFAULT '[]',
        embeds TEXT DEFAULT '[]',
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        edited_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS ticket_blacklist (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        reason TEXT,
        added_by TEXT NOT NULL,
        expires_at INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        PRIMARY KEY (guild_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS mod_cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        moderator_id TEXT NOT NULL,
        action TEXT NOT NULL,
        reason TEXT,
        duration INTEGER,
        expires_at INTEGER,
        active INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS warnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        moderator_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        points INTEGER DEFAULT 1,
        active INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS active_punishments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        moderator_id TEXT NOT NULL,
        reason TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS guard_whitelist (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        added_by TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        PRIMARY KEY (guild_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS guard_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT,
        punishment TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS blacklist (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        reason TEXT,
        added_by TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        PRIMARY KEY (guild_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS cooldowns (
        key TEXT PRIMARY KEY,
        expires_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS statistics (
        guild_id TEXT NOT NULL,
        date TEXT NOT NULL,
        tickets_created INTEGER DEFAULT 0,
        tickets_closed INTEGER DEFAULT 0,
        messages_deleted INTEGER DEFAULT 0,
        members_banned INTEGER DEFAULT 0,
        members_kicked INTEGER DEFAULT 0,
        members_muted INTEGER DEFAULT 0,
        PRIMARY KEY (guild_id, date)
      );

      CREATE TABLE IF NOT EXISTS staff_performance (
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        month TEXT NOT NULL,
        tickets_claimed INTEGER DEFAULT 0,
        tickets_closed INTEGER DEFAULT 0,
        avg_response_time INTEGER DEFAULT 0,
        total_messages INTEGER DEFAULT 0,
        PRIMARY KEY (guild_id, user_id, month)
      );

      CREATE TABLE IF NOT EXISTS auto_responder (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        trigger TEXT NOT NULL,
        response TEXT NOT NULL,
        match_type TEXT DEFAULT 'exact',
        enabled INTEGER DEFAULT 1,
        created_by TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS ticket_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        emoji TEXT,
        created_by TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);

    this._save();
    Logger.success('Database', 'Tablolar hazır');
  }

  // ── Helper Methods ──────────────────────────────────────────────

  _run(sql, params = []) {
    try {
      this.db.run(sql, params);
      return true;
    } catch (err) {
      Logger.error('Database', `SQL hatası: ${err.message}\nSQL: ${sql}`);
      return false;
    }
  }

  _get(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      stmt.bind(params);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      }
      stmt.free();
      return null;
    } catch (err) {
      Logger.error('Database', `SQL hatası: ${err.message}\nSQL: ${sql}`);
      return null;
    }
  }

  _all(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return rows;
    } catch (err) {
      Logger.error('Database', `SQL hatası: ${err.message}\nSQL: ${sql}`);
      return [];
    }
  }

  _lastInsertId() {
    const result = this._get('SELECT last_insert_rowid() as id');
    return result?.id || null;
  }

  // ══════════════════════════════════════════════════════════════
  // GUILD SETTINGS
  // ══════════════════════════════════════════════════════════════

  getGuildSettings(guildId) {
    return this._get('SELECT * FROM guild_settings WHERE guild_id = ?', [guildId]);
  }

  setGuildSetting(guildId, key, value) {
    const existing = this.getGuildSettings(guildId);
    if (!existing) {
      this._run('INSERT INTO guild_settings (guild_id) VALUES (?)', [guildId]);
    }
    this._run(`UPDATE guild_settings SET ${key} = ?, updated_at = strftime('%s', 'now') WHERE guild_id = ?`, [value, guildId]);
    this._save();
  }

  updateGuildSettings(guildId, settings) {
    const existing = this.getGuildSettings(guildId);
    if (!existing) {
      this._run('INSERT INTO guild_settings (guild_id) VALUES (?)', [guildId]);
    }
    const keys = Object.keys(settings);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => settings[k]);
    this._run(`UPDATE guild_settings SET ${setClause}, updated_at = strftime('%s', 'now') WHERE guild_id = ?`, [...values, guildId]);
    this._save();
  }

  // ══════════════════════════════════════════════════════════════
  // TICKET METHODS
  // ══════════════════════════════════════════════════════════════

  createTicket(data) {
    this._run(
      'INSERT INTO tickets (id, guild_id, channel_id, user_id, category, priority, subject) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.id, data.guildId, data.channelId, data.userId, data.category, data.priority || 'medium', data.subject || null]
    );
    this._save();
    return this.getTicket(data.id);
  }

  getTicket(ticketId) {
    return this._get('SELECT * FROM tickets WHERE id = ?', [ticketId]);
  }

  getTicketByChannel(channelId) {
    return this._get('SELECT * FROM tickets WHERE channel_id = ?', [channelId]);
  }

  getUserTickets(guildId, userId, status = null) {
    if (status) {
      return this._all('SELECT * FROM tickets WHERE guild_id = ? AND user_id = ? AND status = ?', [guildId, userId, status]);
    }
    return this._all('SELECT * FROM tickets WHERE guild_id = ? AND user_id = ?', [guildId, userId]);
  }

  getGuildTickets(guildId, status = null) {
    if (status) {
      return this._all('SELECT * FROM tickets WHERE guild_id = ? AND status = ?', [guildId, status]);
    }
    return this._all('SELECT * FROM tickets WHERE guild_id = ?', [guildId]);
  }

  updateTicket(ticketId, data) {
    const keys = Object.keys(data);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => data[k]);
    this._run(`UPDATE tickets SET ${setClause} WHERE id = ?`, [...values, ticketId]);
    this._save();
  }

  closeTicket(ticketId) {
    this._run(`UPDATE tickets SET status = 'closed', closed_at = strftime('%s', 'now') WHERE id = ?`, [ticketId]);
    this._save();
  }

  deleteTicket(ticketId) {
    this._run(`UPDATE tickets SET status = 'deleted', deleted_at = strftime('%s', 'now') WHERE id = ?`, [ticketId]);
    this._save();
  }

  reopenTicket(ticketId) {
    this._run(`UPDATE tickets SET status = 'open', closed_at = NULL WHERE id = ?`, [ticketId]);
    this._save();
  }

  updateTicketActivity(ticketId) {
    this._run(`UPDATE tickets SET last_activity = strftime('%s', 'now'), message_count = message_count + 1 WHERE id = ?`, [ticketId]);
  }

  addTicketParticipant(ticketId, userId, addedBy) {
    this._run('INSERT OR IGNORE INTO ticket_participants (ticket_id, user_id, added_by) VALUES (?, ?, ?)', [ticketId, userId, addedBy]);
    this._save();
  }

  removeTicketParticipant(ticketId, userId) {
    this._run('DELETE FROM ticket_participants WHERE ticket_id = ? AND user_id = ?', [ticketId, userId]);
    this._save();
  }

  getTicketParticipants(ticketId) {
    return this._all('SELECT * FROM ticket_participants WHERE ticket_id = ?', [ticketId]);
  }

  saveTicketMessage(data) {
    this._run(
      'INSERT INTO ticket_messages (id, ticket_id, user_id, username, avatar, content, attachments, embeds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [data.id, data.ticketId, data.userId, data.username, data.avatar, data.content, JSON.stringify(data.attachments || []), JSON.stringify(data.embeds || [])]
    );
  }

  getTicketMessages(ticketId) {
    return this._all('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC', [ticketId]);
  }

  addTicketBlacklist(guildId, userId, reason, addedBy, expiresAt = null) {
    this._run('INSERT OR REPLACE INTO ticket_blacklist (guild_id, user_id, reason, added_by, expires_at) VALUES (?, ?, ?, ?, ?)', [guildId, userId, reason, addedBy, expiresAt]);
    this._save();
  }

  removeTicketBlacklist(guildId, userId) {
    this._run('DELETE FROM ticket_blacklist WHERE guild_id = ? AND user_id = ?', [guildId, userId]);
    this._save();
  }

  isTicketBlacklisted(guildId, userId) {
    const entry = this._get('SELECT * FROM ticket_blacklist WHERE guild_id = ? AND user_id = ?', [guildId, userId]);
    if (!entry) return false;
    if (entry.expires_at && entry.expires_at < Math.floor(Date.now() / 1000)) {
      this.removeTicketBlacklist(guildId, userId);
      return false;
    }
    return entry;
  }

  // ══════════════════════════════════════════════════════════════
  // MODERATION METHODS
  // ══════════════════════════════════════════════════════════════

  createModCase(data) {
    this._run(
      'INSERT INTO mod_cases (guild_id, user_id, moderator_id, action, reason, duration, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.guildId, data.userId, data.moderatorId, data.action, data.reason, data.duration || null, data.expiresAt || null]
    );
    this._save();
    return this._lastInsertId();
  }

  getModCases(guildId, userId) {
    return this._all('SELECT * FROM mod_cases WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC', [guildId, userId]);
  }

  getModCase(caseId) {
    return this._get('SELECT * FROM mod_cases WHERE id = ?', [caseId]);
  }

  addWarning(guildId, userId, moderatorId, reason, points = 1) {
    this._run('INSERT INTO warnings (guild_id, user_id, moderator_id, reason, points) VALUES (?, ?, ?, ?, ?)', [guildId, userId, moderatorId, reason, points]);
    this._save();
    return this._lastInsertId();
  }

  getWarnings(guildId, userId) {
    return this._all('SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? AND active = 1 ORDER BY created_at DESC', [guildId, userId]);
  }

  getWarningPoints(guildId, userId) {
    const result = this._get('SELECT SUM(points) as total FROM warnings WHERE guild_id = ? AND user_id = ? AND active = 1', [guildId, userId]);
    return result?.total || 0;
  }

  removeWarning(warningId) {
    this._run('UPDATE warnings SET active = 0 WHERE id = ?', [warningId]);
    this._save();
  }

  clearWarnings(guildId, userId) {
    this._run('UPDATE warnings SET active = 0 WHERE guild_id = ? AND user_id = ?', [guildId, userId]);
    this._save();
  }

  addActivePunishment(guildId, userId, type, expiresAt, moderatorId, reason) {
    this._run('INSERT INTO active_punishments (guild_id, user_id, type, expires_at, moderator_id, reason) VALUES (?, ?, ?, ?, ?, ?)', [guildId, userId, type, expiresAt, moderatorId, reason]);
    this._save();
  }

  getActivePunishments(guildId, userId) {
    return this._all(`SELECT * FROM active_punishments WHERE guild_id = ? AND user_id = ? AND expires_at > strftime('%s', 'now')`, [guildId, userId]);
  }

  getExpiredPunishments() {
    return this._all(`SELECT * FROM active_punishments WHERE expires_at <= strftime('%s', 'now')`);
  }

  removeActivePunishment(id) {
    this._run('DELETE FROM active_punishments WHERE id = ?', [id]);
    this._save();
  }

  // ══════════════════════════════════════════════════════════════
  // GUARD METHODS
  // ══════════════════════════════════════════════════════════════

  addGuardWhitelist(guildId, userId, addedBy) {
    this._run('INSERT OR IGNORE INTO guard_whitelist (guild_id, user_id, added_by) VALUES (?, ?, ?)', [guildId, userId, addedBy]);
    this._save();
  }

  removeGuardWhitelist(guildId, userId) {
    this._run('DELETE FROM guard_whitelist WHERE guild_id = ? AND user_id = ?', [guildId, userId]);
    this._save();
  }

  isGuardWhitelisted(guildId, userId) {
    return !!this._get('SELECT 1 FROM guard_whitelist WHERE guild_id = ? AND user_id = ?', [guildId, userId]);
  }

  getGuardWhitelist(guildId) {
    return this._all('SELECT * FROM guard_whitelist WHERE guild_id = ?', [guildId]);
  }

  addGuardLog(guildId, userId, action, details, punishment) {
    this._run('INSERT INTO guard_logs (guild_id, user_id, action, details, punishment) VALUES (?, ?, ?, ?, ?)', [guildId, userId, action, details, punishment]);
    this._save();
  }

  // ══════════════════════════════════════════════════════════════
  // BLACKLIST METHODS
  // ══════════════════════════════════════════════════════════════

  addBlacklist(guildId, userId, reason, addedBy) {
    this._run('INSERT OR REPLACE INTO blacklist (guild_id, user_id, reason, added_by) VALUES (?, ?, ?, ?)', [guildId, userId, reason, addedBy]);
    this._save();
  }

  removeBlacklist(guildId, userId) {
    this._run('DELETE FROM blacklist WHERE guild_id = ? AND user_id = ?', [guildId, userId]);
    this._save();
  }

  isBlacklisted(guildId, userId) {
    return !!this._get('SELECT 1 FROM blacklist WHERE guild_id = ? AND user_id = ?', [guildId, userId]);
  }

  // ══════════════════════════════════════════════════════════════
  // COOLDOWN METHODS
  // ══════════════════════════════════════════════════════════════

  getCooldown(key) {
    const entry = this._get('SELECT expires_at FROM cooldowns WHERE key = ?', [key]);
    if (!entry) return null;
    if (entry.expires_at < Math.floor(Date.now() / 1000)) {
      this._run('DELETE FROM cooldowns WHERE key = ?', [key]);
      return null;
    }
    return entry.expires_at;
  }

  setCooldown(key, seconds) {
    const expiresAt = Math.floor(Date.now() / 1000) + seconds;
    this._run('INSERT OR REPLACE INTO cooldowns (key, expires_at) VALUES (?, ?)', [key, expiresAt]);
  }

  clearCooldown(key) {
    this._run('DELETE FROM cooldowns WHERE key = ?', [key]);
  }

  // ══════════════════════════════════════════════════════════════
  // STATISTICS METHODS
  // ══════════════════════════════════════════════════════════════

  incrementStat(guildId, field) {
    const date = new Date().toISOString().split('T')[0];
    const existing = this._get('SELECT * FROM statistics WHERE guild_id = ? AND date = ?', [guildId, date]);
    if (existing) {
      this._run(`UPDATE statistics SET ${field} = ${field} + 1 WHERE guild_id = ? AND date = ?`, [guildId, date]);
    } else {
      this._run(`INSERT INTO statistics (guild_id, date, ${field}) VALUES (?, ?, 1)`, [guildId, date]);
    }
  }

  getStats(guildId, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return this._all('SELECT * FROM statistics WHERE guild_id = ? AND date >= ? ORDER BY date DESC', [guildId, since]);
  }

  updateStaffPerformance(guildId, userId, field) {
    const month = new Date().toISOString().slice(0, 7);
    const existing = this._get('SELECT * FROM staff_performance WHERE guild_id = ? AND user_id = ? AND month = ?', [guildId, userId, month]);
    if (existing) {
      this._run(`UPDATE staff_performance SET ${field} = ${field} + 1 WHERE guild_id = ? AND user_id = ? AND month = ?`, [guildId, userId, month]);
    } else {
      this._run(`INSERT INTO staff_performance (guild_id, user_id, month, ${field}) VALUES (?, ?, ?, 1)`, [guildId, userId, month]);
    }
  }

  getStaffLeaderboard(guildId, month = null) {
    const m = month || new Date().toISOString().slice(0, 7);
    return this._all('SELECT * FROM staff_performance WHERE guild_id = ? AND month = ? ORDER BY tickets_closed DESC LIMIT 10', [guildId, m]);
  }

  // ══════════════════════════════════════════════════════════════
  // AUTO RESPONDER
  // ══════════════════════════════════════════════════════════════

  addAutoResponder(guildId, trigger, response, matchType, createdBy) {
    this._run('INSERT INTO auto_responder (guild_id, trigger, response, match_type, created_by) VALUES (?, ?, ?, ?, ?)', [guildId, trigger, response, matchType, createdBy]);
    this._save();
  }

  getAutoResponders(guildId) {
    return this._all('SELECT * FROM auto_responder WHERE guild_id = ? AND enabled = 1', [guildId]);
  }

  removeAutoResponder(id) {
    this._run('DELETE FROM auto_responder WHERE id = ?', [id]);
    this._save();
  }

  // ══════════════════════════════════════════════════════════════
  // TICKET TAGS
  // ══════════════════════════════════════════════════════════════

  addTicketTag(guildId, name, content, emoji, createdBy) {
    this._run('INSERT INTO ticket_tags (guild_id, name, content, emoji, created_by) VALUES (?, ?, ?, ?, ?)', [guildId, name, content, emoji, createdBy]);
    this._save();
  }

  getTicketTags(guildId) {
    return this._all('SELECT * FROM ticket_tags WHERE guild_id = ?', [guildId]);
  }

  getTicketTag(guildId, name) {
    return this._get('SELECT * FROM ticket_tags WHERE guild_id = ? AND name = ?', [guildId, name]);
  }

  removeTicketTag(id) {
    this._run('DELETE FROM ticket_tags WHERE id = ?', [id]);
    this._save();
  }

  // ── Kapatma ─────────────────────────────────────────────────
  close() {
    this._save();
    if (this.db) {
      this.db.close();
      Logger.info('Database', 'Bağlantı kapatıldı');
    }
  }
}

// Singleton instance
const instance = new DatabaseManager();
module.exports = instance;