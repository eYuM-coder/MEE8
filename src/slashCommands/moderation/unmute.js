const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Logging = require("../../database/schemas/logging");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Unmute a person in the server!")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Person who you want to unmute.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("The reason for unmuting")
    )
    .setContexts(0)
    .setIntegrationTypes(0),
  async execute(interaction) {
    try {
      const client = interaction.client;
      const logging = await Logging.findOne({
        guildId: interaction.guild.id,
      });
      
      // Check if the user has permission to use this command
      if (!interaction.member.permissions.has("MODERATE_MEMBERS"))
        return interaction.followUp({
          content: "You do not have permission to use this command.",
        });

      const member = interaction.options.getMember("member");
      const reason =
        interaction.options.getString("reason") || "No reason provided";

      // Check if the member is valid
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

      // Remove timeout (unmute the member)
      await member.timeout(null, reason); // This will remove the timeout

      let timeoutsuccess = new MessageEmbed()
        .setColor("GREEN")
        .setDescription(
          `${client.emoji.success} | ${member} has been unmuted.`
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

      // DM the user about the unmute
      let dmEmbed = new MessageEmbed()
        .setColor("GREEN")
        .setDescription(
          `You have been unmuted in **${interaction.guild.name}**.\n\n__**Moderator:**__ ${interaction.user} **(${interaction.user.tag})**\n__**Reason:**__ ${reason || "No Reason Provided"}`
        )
        .setTimestamp();

      return member
        .send({ embeds: [dmEmbed] })
        .catch(() => {
          // Handle the case where the user has DMs disabled
          interaction.followUp({
            content: `I couldn't send a DM to ${member}, they might have DMs disabled.`,
            ephemeral: true,
          });
        });
      
    } catch (err) {
      console.error(err);
      interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(`${interaction.client.emoji.fail} | An error occurred.`)
        ],
        ephemeral: true,
      });
    }
  },
};
