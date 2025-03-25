const { SlashCommandBuilder } = require("@discordjs/builders");
const Guild = require("../../database/schemas/Guild");
const afk = require("../../database/models/afk.js");
const discord = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("afk")
    .setDescription("Set an AFK message!")
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription(
          "The reason to go AFK (if left blank, the message will be 'AFK')"
        )
    )
    .setContexts(0)
    .setIntegrationTypes(0),

  async execute(interaction) {
    const guildDB = await Guild.findOne({
      guildId: interaction.guild.id,
    });

    const language = require(`../../data/language/${guildDB.language}.json`);
    const reason = interaction.options.getString("reason") || "AFK";
    const member = interaction.guild.members.cache.get(interaction.user.id);

    if (!member) {
      return interaction.reply({
        content: "Could not find your member profile in this server.",
        ephemeral: true,
      });
    }

    const oldNickname = member.nickname || interaction.user.username;
    const newNickname = `[AFK] ${oldNickname}`;

    const afklist = await afk.findOne({ userID: interaction.user.id });

    if (!afklist) {
      const newAfk = new afk({
        serverID: interaction.guild.id,
        userID: interaction.user.id,
        reason: reason,
        oldNickname: oldNickname,
        time: Date.now(),
      });

      try {
        await member.setNickname(newNickname);
      } catch (err) {
        console.error("Failed to update nickname:", err);
      }

      const embed = new discord.MessageEmbed()
        .setDescription(`${language.afk5} ${reason}`)
        .setColor(interaction.client.color.blurple)
        .setAuthor({
          name: `${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        });

      interaction.reply({ embeds: [embed] });
      newAfk.save().catch((err) => console.error(err));
    }
  },
};
