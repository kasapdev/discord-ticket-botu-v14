// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - Permission Guard
// ═══════════════════════════════════════════════════════════════

const { PermissionFlagsBits } = require('discord.js');
const db = require('../database/Database');
const Embed = require('../layouts/EmbedBuilder');

class PermissionGuard {
  /**
   * Kullanıcının staff olup olmadığını kontrol eder
   */
  static isStaff(interaction) {
    const settings = db.getGuildSettings(interaction.guild?.id);
    if (!settings?.staff_role) return false;
    return interaction.member?.roles.cache.has(settings.staff_role) || false;
  }

  /**
   * Kullanıcının admin olup olmadığını kontrol eder
   */
  static isAdmin(interaction) {
    return interaction.member?.permissions.has(PermissionFlagsBits.Administrator) || false;
  }

  /**
   * Kullanıcının sunucu sahibi olup olmadığını kontrol eder
   */
  static isOwner(interaction) {
    return interaction.user?.id === interaction.guild?.ownerId;
  }

  /**
   * Staff veya admin kontrolü
   */
  static isStaffOrAdmin(interaction) {
    return this.isStaff(interaction) || this.isAdmin(interaction);
  }

  /**
   * Yetki kontrolü yapar ve hata mesajı döndürür
   */
  static async checkStaff(interaction) {
    if (!this.isStaffOrAdmin(interaction)) {
      await interaction.reply({
        embeds: [Embed.error('Yetersiz Yetki', 'Bu komutu kullanmak için yetkili rolüne sahip olmanız gerekiyor.')],
        ephemeral: true,
      });
      return false;
    }
    return true;
  }

  /**
   * Admin kontrolü yapar
   */
  static async checkAdmin(interaction) {
    if (!this.isAdmin(interaction)) {
      await interaction.reply({
        embeds: [Embed.error('Yetersiz Yetki', 'Bu komutu kullanmak için yönetici yetkisine sahip olmanız gerekiyor.')],
        ephemeral: true,
      });
      return false;
    }
    return true;
  }

  /**
   * Blacklist kontrolü
   */
  static isBlacklisted(guildId, userId) {
    return db.isBlacklisted(guildId, userId);
  }
}

module.exports = PermissionGuard;