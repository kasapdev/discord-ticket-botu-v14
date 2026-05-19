// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - Gelişmiş Logger Sistemi
// ═══════════════════════════════════════════════════════════════

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.resolve('./logs');
    this._ensureDir();
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.levels = { debug: 0, info: 1, warn: 2, error: 3 };
  }

  _ensureDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  _timestamp() {
    return new Date().toLocaleString('tr-TR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  }

  _writeToFile(level, tag, message) {
    try {
      const date = new Date().toISOString().split('T')[0];
      const logFile = path.join(this.logDir, `${date}.log`);
      const line = `[${this._timestamp()}] [${level.toUpperCase()}] [${tag}] ${message}\n`;
      fs.appendFileSync(logFile, line, 'utf8');
    } catch (_) {}
  }

  _shouldLog(level) {
    return (this.levels[level] || 0) >= (this.levels[this.logLevel] || 0);
  }

  _format(icon, colorFn, level, tag, message) {
    const ts = chalk.gray(`[${this._timestamp()}]`);
    const lvl = colorFn(`[${level.toUpperCase()}]`);
    const tg = chalk.cyan(`[${tag}]`);
    const msg = chalk.white(message);
    return `${ts} ${icon} ${lvl} ${tg} ${msg}`;
  }

  debug(tag, message) {
    if (!this._shouldLog('debug')) return;
    console.log(this._format('🔍', chalk.gray, 'debug', tag, message));
    this._writeToFile('debug', tag, message);
  }

  info(tag, message) {
    if (!this._shouldLog('info')) return;
    console.log(this._format('ℹ️ ', chalk.blue, 'info', tag, message));
    this._writeToFile('info', tag, message);
  }

  success(tag, message) {
    if (!this._shouldLog('info')) return;
    console.log(this._format('✅', chalk.green, 'success', tag, message));
    this._writeToFile('success', tag, message);
  }

  warn(tag, message) {
    if (!this._shouldLog('warn')) return;
    console.log(this._format('⚠️ ', chalk.yellow, 'warn', tag, message));
    this._writeToFile('warn', tag, message);
  }

  error(tag, message, err = null) {
    if (!this._shouldLog('error')) return;
    console.error(this._format('❌', chalk.red, 'error', tag, message));
    if (err) console.error(chalk.red(err.stack || err));
    this._writeToFile('error', tag, err ? `${message} | ${err.stack || err}` : message);
  }

  command(tag, message) {
    console.log(this._format('⚡', chalk.magenta, 'cmd', tag, message));
    this._writeToFile('cmd', tag, message);
  }

  event(tag, message) {
    console.log(this._format('📡', chalk.cyan, 'event', tag, message));
    this._writeToFile('event', tag, message);
  }

  ticket(tag, message) {
    console.log(this._format('🎫', chalk.blue, 'ticket', tag, message));
    this._writeToFile('ticket', tag, message);
  }

  mod(tag, message) {
    console.log(this._format('🔨', chalk.red, 'mod', tag, message));
    this._writeToFile('mod', tag, message);
  }

  guard(tag, message) {
    console.log(this._format('🛡️ ', chalk.yellow, 'guard', tag, message));
    this._writeToFile('guard', tag, message);
  }

  // Başlangıç banner'ı
  banner(name, version) {
    const line = chalk.blue('═'.repeat(55));
    console.log('\n' + line);
    console.log(chalk.bold.blue(`  🤖  ${name} v${version}`));
    console.log(chalk.gray(`  Discord Ticket & Moderation Bot`));
    console.log(chalk.gray(`  Node.js ${process.version} | Discord.js v14`));
    console.log(line + '\n');
  }
}

module.exports = new Logger();