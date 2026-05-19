// kasapac tarafindan yapilmistir.
// ═══════════════════════════════════════════════════════════════
// METETICKET BOT - /unban Komutu
// ═══════════════════════════════════════════════════════════════

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Embed = require('../../layouts/EmbedBuilder');
const db = require('../../database/Database');
const LogSystem = require('../../systems/LogSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Kullanıcının banını kaldırır')
    .addStringOption(opt =>
      opt.setName('kullanici-id').setDescription('Banı kaldırılacak kullanıcı ID').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('sebep').setDescription('Sebep').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  cooldown: 5,

  async execute(interaction) {
    const userId = interaction.options.getString('kullanici-id');
    const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';

    // ID formatı kontrolü
    if (!/^\d{17,19}$/.test(userId)) {
      return interaction.reply({
        embeds: [Embed.error('Hata', 'Geçersiz kullanıcı ID formatı.')],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      // Ban listesinde var mı kontrol et
      const banList = await interaction.guild.bans.fetch();
      const ban = banList.get(userId);

      if (!ban) {
        return interaction.editReply({
          embeds: [Embed.warning('Bulunamadı', `\`${userId}\` ID\'li kullanıcı ban listesinde değil.`)],
        });
      }

      await interaction.guild.members.unban(userId, `${interaction.user.tag}: ${reason}`);

      const caseId = db.createModCase({
        guildId: interaction.guild.id, userId,
        moderatorId: interaction.user.id, action: 'unban', reason,
      });

      await LogSystem.modLog(interaction.guild, 'unban', ban.user, interaction.user, reason, { caseId });

      await interaction.editReply({
        embeds: [Embed.success('Ban Kaldırıldı', `**${ban.user.tag}** kullanıcısının banı kaldırıldı.\n\n**Sebep:** ${reason}\n**Vaka:** #${caseId}`)],
      });
    } catch (err) {
      await interaction.editReply({ embeds: [Embed.error('Hata', `Ban kaldırılamadı: ${err.message}`)] });
    }
  },
};