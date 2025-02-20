const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Logging = require("../../database/schemas/logging.js");
const Guild = require("../../database/schemas/Guild");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a person in the server!")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Person you want to ban.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Reason for the ban.")
    )
    .setContexts(0)
    .setIntegrationTypes(0),

  async execute(interaction) {
    try {
      if (!interaction.member.permissions.has("BAN_MEMBERS")) {
        return interaction.reply({
          content: "You do not have permission to use this command.",
          ephemeral: true,
        });
      }

      const client = interaction.client;
      const guildDb = await Guild.findOne({ guildId: interaction.guild.id });
      const logging = await Logging.findOne({ guildId: interaction.guild.id });
      const language = require(`../../data/language/${guildDb.language}.json`);

      const targetUser = interaction.options.getUser("member");
      if (!targetUser) {
        return interaction.reply({
          content: "User not found.",
          ephemeral: true,
        });
      }

      if (targetUser.id === interaction.user.id) {
        return interaction.reply({
          content: `${client.emoji.fail} | ${language.banYourselfError}!`,
          ephemeral: true,
        });
      }

      let reason =
        interaction.options.getString("reason") || "No reason provided.";
      if (reason.length > 512) reason = reason.slice(0, 509) + "...";

      // **DM the user before banning**
      let dmEmbed;
      if (
        logging &&
        logging.moderation.ban_action &&
        logging.moderation.ban_message.toggle === "false" &&
        logging.moderation.ban_action !== "1"
      ) {
        if (logging.moderation.ban_action === "2") {
          dmEmbed = `${interaction.client.emoji.fail} You've been banned in **${interaction.guild.name}**`;
        } else if (logging.moderation.ban_action === "3") {
          dmEmbed = `${interaction.client.emoji.fail} You've been banned in **${interaction.guild.name}**. | ${reason}`;
        } else if (logging.moderation.ban_action === "4") {
          dmEmbed = `${interaction.client.emoji.fail} You've been banned in **${interaction.guild.name}**. | ${reason}\n\n-# __**Moderator:**__ ${interaction.user} (${interaction.user.tag})`;
        }

        targetUser
          .send({
            embeds: [
              new MessageEmbed()
                .setColor(interaction.client.color.red)
                .setDescription(dmEmbed),
            ],
          })
          .catch(() => {});
      }

      try {
        await targetUser.send({ embeds: [dmEmbed] });
      } catch {
        console.log(`Could not send DM to ${targetUser.tag}.`);
      }

      // **Ban the user**
      const response = await interaction.guild.bans
        .create(targetUser.id, { reason })
        .catch(() => null);

      if (response) {
        const banEmbed = new MessageEmbed()
          .setColor("GREEN")
          .setDescription(
            `${client.emoji.success} | **${targetUser.tag}** has been banned.\n**Reason:** ${reason}`
          );

        interaction.reply({ embeds: [banEmbed] }).then(async () => {
          if (logging && logging.moderation.delete_reply === "true") {
            setTimeout(() => {
              interaction.deleteReply().catch(() => {});
            }, 5000);
          }
        });

        // **Logging System**
        if (logging) {
          const logChannel = interaction.guild.channels.cache.get(
            logging.moderation.channel
          );
          if (logging.moderation.toggle === "true" && logChannel) {
            const logEmbed = new MessageEmbed()
              .setTitle("User Banned")
              .setColor("RED")
              .addField("User", `${targetUser.tag} (${targetUser.id})`, true)
              .addField("Moderator", `${interaction.user.tag}`, true)
              .addField("Reason", reason, true)
              .setTimestamp();

            logChannel.send({ embeds: [logEmbed] }).catch(console.error);
          }
        }
      } else {
        return interaction.reply({
          content: `${client.emoji.fail} | I couldn't ban this user. Make sure I have the correct permissions.`,
          ephemeral: true,
        });
      }
    } catch (err) {
      console.error(err);
      interaction.reply({
        content: `${client.emoji.fail} | An error occurred while trying to ban the user.`,
        ephemeral: true,
      });
    }
  },
};
