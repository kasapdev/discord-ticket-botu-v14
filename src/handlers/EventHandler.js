// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - Event Handler
// ═══════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const Logger = require('../utils/Logger');

class EventHandler {
  constructor(client) {
    this.client = client;
  }

  /**
   * Tüm event'leri yükler
   */
  async loadEvents() {
    const eventsPath = path.join(__dirname, '../events');
    const files = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
    let loaded = 0;
    let failed = 0;

    for (const file of files) {
      try {
        const filePath = path.join(eventsPath, file);
        delete require.cache[require.resolve(filePath)];
        const event = require(filePath);

        if (!event.name || !event.execute) {
          Logger.warn('EventHandler', `Geçersiz event: ${file}`);
          failed++;
          continue;
        }

        const handler = (...args) => event.execute(this.client, ...args);

        if (event.once) {
          this.client.once(event.name, handler);
        } else {
          this.client.on(event.name, handler);
        }

        Logger.debug('EventHandler', `Event yüklendi: ${event.name} [${event.once ? 'once' : 'on'}]`);
        loaded++;
      } catch (err) {
        Logger.error('EventHandler', `Event yüklenemedi: ${file}`, err);
        failed++;
      }
    }

    Logger.success('EventHandler', `${loaded} event yüklendi, ${failed} başarısız`);
    return { loaded, failed };
  }
}

module.exports = EventHandler;