// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - /clear, /slowmode, /lock, /unlock Komutları
// ═══════════════════════════════════════════════════════════════

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Embed = require('../../layouts/EmbedBuilder');
const db = require('../../database/Database');
const LogSystem = require('../../systems/LogSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Kanaldan mesaj temizler')
    .addIntegerOption(opt =>
      opt.setName('miktar').setDescription('Silinecek mesaj sayısı (1-100)').setMinValue(1).setMaxValue(100).setRequired(true)
    )
    .addUserOption(opt =>
      opt.setName('kullanici').setDescription('Sadece bu kullanıcının mesajlarını sil').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  cooldown: 5,

  async execute(interaction) {
    const amount = interaction.options.getInteger('miktar');
    const targetUser = interaction.options.getUser('kullanici');

    await interaction.deferReply({ ephemeral: true });

    try {
      let messages = await interaction.channel.messages.fetch({ limit: amount });

      if (targetUser) {
        messages = messages.filter(m => m.author.id === targetUser.id);
      }

      // 14 günden eski mesajları filtrele
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      messages = messages.filter(m => m.createdTimestamp > twoWeeksAgo);

      if (messages.size === 0) {
        return interaction.editReply({
          embeds: [Embed.warning('Mesaj Yok', 'Silinecek mesaj bulunamadı (14 günden eski mesajlar silinemez).')],
        });
      }

      const deleted = await interaction.channel.bulkDelete(messages, true);

      await LogSystem.modLog(interaction.guild, 'clear', interaction.user, interaction.user, `${deleted.size} mesaj silindi`, {
        amount: deleted.size, channel: interaction.channel,
      });

      await interaction.editReply({
        embeds: [Embed.success('Mesajlar Temizlendi', `**${deleted.size}** mesaj başarıyla silindi.${targetUser ? `\n**Kullanıcı:** ${targetUser.tag}` : ''}`)],
      });
    } catch (err) {
      await interaction.editReply({ embeds: [Embed.error('Hata', `Mesajlar silinemedi: ${err.message}`)] });
    }
  },
};