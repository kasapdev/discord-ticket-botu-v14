// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - Command Handler
// ═══════════════════════════════════════════════════════════════

const { REST, Routes, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const Logger = require('../utils/Logger');

class CommandHandler {
  constructor(client) {
    this.client = client;
    this.commands = new Collection();
    this.cooldowns = new Collection();
  }

  /**
   * Tüm komutları yükler
   */
  async loadCommands() {
    const commandsPath = path.join(__dirname, '../commands');
    const categories = fs.readdirSync(commandsPath);
    let loaded = 0;
    let failed = 0;

    for (const category of categories) {
      const categoryPath = path.join(commandsPath, category);
      const stat = fs.statSync(categoryPath);
      if (!stat.isDirectory()) continue;

      const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'));

      for (const file of files) {
        try {
          const filePath = path.join(categoryPath, file);
          // Cache'i temizle (hot reload için)
          delete require.cache[require.resolve(filePath)];
          const command = require(filePath);

          if (!command.data || !command.execute) {
            Logger.warn('CommandHandler', `Geçersiz komut: ${file} (data veya execute eksik)`);
            failed++;
            continue;
          }

          command.category = category;
          this.commands.set(command.data.name, command);
          Logger.debug('CommandHandler', `Komut yüklendi: /${command.data.name} [${category}]`);
          loaded++;
        } catch (err) {
          Logger.error('CommandHandler', `Komut yüklenemedi: ${file}`, err);
          failed++;
        }
      }
    }

    Logger.success('CommandHandler', `${loaded} komut yüklendi, ${failed} başarısız`);
    return { loaded, failed };
  }

  /**
   * Slash komutları Discord'a kayıt eder
   * GUILD_ID varsa sadece o guild'e kayıt eder (anlik, tavsiye edilen)
   * GUILD_ID yoksa global kayıt yapar (1 saat gecikme)
   */
  async registerCommands() {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const commandData = this.commands.map(cmd => cmd.data.toJSON());

    try {
      Logger.info('CommandHandler', `${commandData.length} slash komut kaydediliyor...`);

      let data;
      if (process.env.GUILD_ID) {
        // Guild'e özel kayıt (anlık, tek sunucu modu)
        data = await rest.put(
          Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
          { body: commandData }
        );
        Logger.success('CommandHandler', `${data.length} komut guild'e kaydedildi (guild-only mod: ${process.env.GUILD_ID})`);
      } else {
        // Global kayıt (1 saat gecikme)
        data = await rest.put(
          Routes.applicationCommands(process.env.CLIENT_ID),
          { body: commandData }
        );
        Logger.success('CommandHandler', `${data.length} komut global olarak kaydedildi`);
      }
    } catch (err) {
      Logger.error('CommandHandler', 'Komut kaydı başarısız', err);
    }
  }

  /**
   * Interaction'ı işler
   */
  async handleInteraction(interaction) {
    if (!interaction.isChatInputCommand()) return;

    // Guild-only mod: sadece belirtilen guild'den gelen komutları işle
    if (process.env.GUILD_ID && interaction.guildId !== process.env.GUILD_ID) {
      return;
    }

    const command = this.commands.get(interaction.commandName);
    if (!command) {
      Logger.warn('CommandHandler', `Bilinmeyen komut: ${interaction.commandName}`);
      return;
    }

    // Cooldown kontrolü
    const cooldownResult = this._checkCooldown(interaction, command);
    if (cooldownResult) {
      const Embed = require('../layouts/EmbedBuilder');
      return interaction.reply({
        embeds: [Embed.warning('Cooldown', cooldownResult)],
        ephemeral: true,
      });
    }

    // Guard kontrolü (blacklist)
    const db = require('../database/Database');
    if (db.isBlacklisted(interaction.guildId, interaction.user.id)) {
      const Embed = require('../layouts/EmbedBuilder');
      return interaction.reply({
        embeds: [Embed.error('Kara Liste', 'Bu sunucuda kara listedesiniz ve komut kullanamazsınız.')],
        ephemeral: true,
      });
    }

    try {
      Logger.command('CommandHandler', `/${interaction.commandName} — ${interaction.user.tag} (${interaction.guildId})`);
      await command.execute(interaction, this.client);
    } catch (err) {
      Logger.error('CommandHandler', `Komut hatası: /${interaction.commandName}`, err);

      const Embed = require('../layouts/EmbedBuilder');
      const errorEmbed = Embed.error(
        'Bir Hata Oluştu',
        `Komut çalıştırılırken beklenmeyen bir hata oluştu.\n\`\`\`${err.message}\`\`\``
      );

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
          await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
      } catch (_) {}
    }
  }

  /**
   * Cooldown kontrolü
   */
  _checkCooldown(interaction, command) {
    const config = require('../config/config');
    const cooldownAmount = (command.cooldown || config.cooldowns.default) * 1000;

    if (!this.cooldowns.has(command.data.name)) {
      this.cooldowns.set(command.data.name, new Collection());
    }

    const timestamps = this.cooldowns.get(command.data.name);
    const now = Date.now();
    const key = `${interaction.guildId}-${interaction.user.id}`;

    if (timestamps.has(key)) {
      const expirationTime = timestamps.get(key) + cooldownAmount;
      if (now < expirationTime) {
        const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
        return `Bu komutu tekrar kullanmak için **${timeLeft}** saniye beklemelisiniz.`;
      }
    }

    timestamps.set(key, now);
    setTimeout(() => timestamps.delete(key), cooldownAmount);
    return null;
  }

  /**
   * Komut listesini döndürür
   */
  getCommands() {
    return this.commands;
  }

  /**
   * Kategori bazlı komutları döndürür
   */
  getCommandsByCategory(category) {
    return this.commands.filter(cmd => cmd.category === category);
  }
}

module.exports = CommandHandler;