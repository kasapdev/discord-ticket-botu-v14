// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - /stats & /leaderboard Komutları
// ═══════════════════════════════════════════════════════════════

const { SlashCommandBuilder } = require('discord.js');
const Embed = require('../../layouts/EmbedBuilder');
const db = require('../../database/Database');
const config = require('../../config/config');
const { formatNumber, progressBar } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Sunucu istatistiklerini gösterir')
    .addSubcommand(sub =>
      sub.setName('server').setDescription('Sunucu istatistikleri')
    )
    .addSubcommand(sub =>
      sub.setName('tickets').setDescription('Ticket istatistikleri')
    )
    .addSubcommand(sub =>
      sub.setName('leaderboard').setDescription('Yetkili liderlik tablosu')
    ),

  cooldown: 10,

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'server') {
      const stats = db.getStats(interaction.guild.id, 30);
      const totals = stats.reduce((acc, s) => {
        acc.tickets_created += s.tickets_created || 0;
        acc.tickets_closed += s.tickets_closed || 0;
        acc.members_banned += s.members_banned || 0;
        acc.members_kicked += s.members_kicked || 0;
        acc.members_muted += s.members_muted || 0;
        acc.messages_deleted += s.messages_deleted || 0;
        return acc;
      }, { tickets_created: 0, tickets_closed: 0, members_banned: 0, members_kicked: 0, members_muted: 0, messages_deleted: 0 });

      const openTickets = db.getGuildTickets(interaction.guild.id, 'open').length;
      const totalTickets = db.getGuildTickets(interaction.guild.id).length;

      await interaction.reply({
        embeds: [Embed.premium({
          color: config.colors.primary,
          title: `📊 ${interaction.guild.name} — Sunucu İstatistikleri`,
          description: `Son **30 günlük** istatistikler`,
          fields: [
            { name: '🎫 Ticket', value: `Oluşturulan: **${formatNumber(totals.tickets_created)}**\nKapatılan: **${formatNumber(totals.tickets_closed)}**\nAçık: **${openTickets}**\nToplam: **${totalTickets}**`, inline: true },
            { name: '🔨 Moderasyon', value: `Ban: **${formatNumber(totals.members_banned)}**\nKick: **${formatNumber(totals.members_kicked)}**\nMute: **${formatNumber(totals.members_muted)}**`, inline: true },
            { name: '📢 Sunucu', value: `Üye: **${formatNumber(interaction.guild.memberCount)}**\nRol: **${interaction.guild.roles.cache.size}**\nKanal: **${interaction.guild.channels.cache.size}**`, inline: true },
          ],
          thumbnail: interaction.guild.iconURL({ dynamic: true }),
          footer: `Son 30 gün • ${interaction.guild.name}`,
        })],
      });
    }

    if (subcommand === 'tickets') {
      const allTickets = db.getGuildTickets(interaction.guild.id);
      const openTickets = allTickets.filter(t => t.status === 'open');
      const closedTickets = allTickets.filter(t => t.status === 'closed');

      // Kategori dağılımı
      const categoryStats = {};
      for (const ticket of allTickets) {
        categoryStats[ticket.category] = (categoryStats[ticket.category] || 0) + 1;
      }

      const categoryList = Object.entries(categoryStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([cat, count]) => {
          const catConfig = config.ticket.categories.find(c => c.id === cat);
          const bar = progressBar(count, allTickets.length, 8);
          return `${catConfig?.emoji || '📋'} **${catConfig?.label || cat}**: ${count} (${bar})`;
        })
        .join('\n');

      // Ortalama puanlama
      const ratedTickets = allTickets.filter(t => t.rating);
      const avgRating = ratedTickets.length > 0
        ? (ratedTickets.reduce((sum, t) => sum + t.rating, 0) / ratedTickets.length).toFixed(1)
        : 'N/A';

      await interaction.reply({
        embeds: [Embed.premium({
          color: config.colors.ticket,
          title: `🎫 Ticket İstatistikleri`,
          fields: [
            { name: '📊 Genel', value: `Toplam: **${allTickets.length}**\nAçık: **${openTickets.length}**\nKapalı: **${closedTickets.length}**`, inline: true },
            { name: '⭐ Puanlama', value: `Ortalama: **${avgRating}/5**\nPuanlanan: **${ratedTickets.length}**`, inline: true },
            { name: '📂 Kategori Dağılımı', value: categoryList || 'Veri yok', inline: false },
          ],
          footer: `${interaction.guild.name} Ticket Sistemi`,
        })],
      });
    }

    if (subcommand === 'leaderboard') {
      const leaderboard = db.getStaffLeaderboard(interaction.guild.id);

      if (leaderboard.length === 0) {
        return interaction.reply({
          embeds: [Embed.info('Liderlik Tablosu', 'Bu ay için henüz veri yok.')],
          ephemeral: true,
        });
      }

      const medals = ['🥇', '🥈', '🥉'];
      const list = leaderboard.map((entry, i) => {
        const medal = medals[i] || `**${i + 1}.**`;
        return `${medal} <@${entry.user_id}> — Kapatılan: **${entry.tickets_closed}** | Üstlenilen: **${entry.tickets_claimed}**`;
      }).join('\n');

      const month = new Date().toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

      await interaction.reply({
        embeds: [Embed.premium({
          color: config.colors.gold,
          title: `🏆 Yetkili Liderlik Tablosu — ${month}`,
          description: list,
          thumbnail: interaction.guild.iconURL({ dynamic: true }),
          footer: `${interaction.guild.name} • ${month}`,
        })],
      });
    }
  },
};