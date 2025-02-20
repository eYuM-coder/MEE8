const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const ms = require("ms");
const Logging = require("../../database/schemas/logging");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Mute a person in the server!")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Person who you want to put in timeout.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("time")
        .setDescription("For how much time you want to timeout for")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("The reason for the timeout")
    )
    .setContexts(0)
    .setIntegrationTypes(0),
  async execute(interaction) {
    try {
      const client = interaction.client;
      const logging = await Logging.findOne({
        guildId: interaction.guild.id,
      });

      if (!interaction.member.permissions.has("MODERATE_MEMBERS"))
        return interaction.followUp({
          content: "You do not have permission to use this command.",
          ephemeral: true,
        });

      const member = interaction.options.getMember("member");
      const reason =
        interaction.options.getString("reason") || "No reason provided";
      const time = ms(interaction.options.getString("time"));

      if (!member) {
        let usernotfound = new MessageEmbed()
          .setColor("RED")
          .setDescription(`${client.emoji.fail} | I can't find that member`);
        return interaction
          .reply({ embeds: [usernotfound] })
          .then(async () => {
            if (logging && logging.moderation.delete_reply === "true") {
              setTimeout(() => {
                interaction.deleteReply().catch(() => {});
              }, 5000);
            }
          })
          .catch(() => {});
      }

      if (!time) {
        let timevalid = new MessageEmbed()
          .setColor("RED")
          .setDescription(
            `${client.emoji.fail} | The time specified is not valid. Please provide a valid time.`
          );
        return interaction.reply({ embeds: [timevalid] }).then(async () => {
          if (logging && logging.moderation.delete_reply === "true") {
            setTimeout(() => {
              interaction.deleteReply().catch(() => {});
            }, 5000);
          }
        });
      }

      const response = await member.timeout(time, reason);

      if (response) {
        let timeoutsuccess = new MessageEmbed()
          .setColor("GREEN")
          .setDescription(
            `***${client.emoji.success} | ${member} has been timed out for ${ms(
              time,
              { long: true }
            )}* || ${reason}**`
          );
        await interaction
          .reply({ embeds: [timeoutsuccess] })
          .then(async () => {
            if (logging && logging.moderation.delete_reply === "true") {
              setTimeout(() => {
                interaction.deleteReply().catch(() => {});
              }, 5000);
            }
          })
          .catch(() => {});

        let dmEmbed = new MessageEmbed()
          .setColor("RED")
          .setDescription(
            `You have been muted in **${
              interaction.guild.name
            }**.\n\n__**Moderator:**__ ${interaction.user} **(${
              interaction.user.tag
            })**\n__**Reason:**__ ${reason || "No Reason Provided"}`
          )
          .setTimestamp();

        // DM the user about the mute
        return member.send({ embeds: [dmEmbed] }).catch(() => {
          // Handle the case where the user has DMs disabled
          interaction.followUp({
            content: `I couldn't send a DM to ${member}, they might have DMs disabled.`,
            ephemeral: true,
          });
        });
      } else {
        let failembed = new MessageEmbed()
          .setColor(client.color.red)
          .setDescription(
            `${client.emoji.fail} | That user is a mod/admin, I can't do that.`
          )
          .setTimestamp();
        return interaction.reply({ embeds: [failembed] });
      }
    } catch (err) {
      console.error(err);
      interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(
              `${interaction.client.emoji.fail} | There was an error.`
            ),
        ],
        ephemeral: true,
      });
    }
  },
};
