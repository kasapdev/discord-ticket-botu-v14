// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - Ana Giriş Noktası
// ═══════════════════════════════════════════════════════════════

// Environment değŸişkenlerini yükle
require('dotenv').config();

const { Client, GatewayIntentBits, Partials } = require('discord.js');
const Logger = require('./utils/Logger');
const config = require('./config/config');

// â”€â”€ Anti-Crash Sistemi â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
process.on('uncaughtException', (err) => {
  Logger.error('AntiCrash', 'Yakalanmamış hata (uncaughtException)', err);
});

process.on('unhandledRejection', (reason, promise) => {
  Logger.error('AntiCrash', `İşlenmeyen Promise reddi: ${reason}`, reason instanceof Error ? reason : new Error(String(reason)));
});

process.on('SIGINT', () => {
  Logger.info('Process', 'Bot kapatılıyor (SIGINT)...');
  const db = require('./database/Database');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  Logger.info('Process', 'Bot kapatılıyor (SIGTERM)...');
  const db = require('./database/Database');
  db.close();
  process.exit(0);
});

// â”€â”€ Discord Client â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.User,
    Partials.GuildMember,
  ],
  // Rate limit koruması
  rest: {
    retries: 3,
    timeout: 15000,
  },
});

// â”€â”€ Handler'ları Başlat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function bootstrap() {
  try {
    Logger.banner(config.bot.name, config.bot.version);
    Logger.info('Bootstrap', 'Bot başlatılıyor...');

    // Handler'ları oluştur ve client'a ekle
    const CommandHandler = require('./handlers/CommandHandler');
    const EventHandler = require('./handlers/EventHandler');
    const InteractionHandler = require('./handlers/InteractionHandler');

    client.commandHandler = new CommandHandler(client);
    client.interactionHandler = new InteractionHandler(client);

    // Komutları yükle
    await client.commandHandler.loadCommands();

    // Event'leri yükle
    const eventHandler = new EventHandler(client);
    await eventHandler.loadEvents();

    // Discord'a bağŸlan
    Logger.info('Bootstrap', 'Discord\'a bağŸlanılıyor...');
    await client.login(process.env.DISCORD_TOKEN);

    // Komutları kaydet (login sonrası)
    client.once('clientReady', async () => {
      await client.commandHandler.registerCommands();
    });

  } catch (err) {
    Logger.error('Bootstrap', 'Bot başlatılamadı', err);
    process.exit(1);
  }
}

// â”€â”€ Başlat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
bootstrap();