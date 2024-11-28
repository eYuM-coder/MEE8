const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Logging = require("../../database/schemas/logging");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a person in the server!")
    .addStringOption((option) =>
      option
        .setName("member")
        .setDescription("Mention, tag, or ID of the person you want to unban")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("The reason for the unban")
    ),
  async execute(interaction) {
    try {
      const client = interaction.client;
      const logging = await Logging.findOne({
        guildId: interaction.guild.id,
      });

      // Check if the user has proper permissions
      if (!interaction.member.permissions.has("BAN_MEMBERS")) {
        return interaction.reply({
          content: "You do not have permission to use this command.",
          ephemeral: true,
        });
      }

      // Fetch the options
      const input = interaction.options.getString("member");
      const reason =
        interaction.options.getString("reason") || "No reason provided";

      // Fetch all bans to find the user
      const bans = await interaction.guild.bans.fetch();

      // Try to find the user based on ID, tag, or mention
      const banInfo = bans.find((ban) => {
        return (
          ban.user.id === input || // Match by ID
          ban.user.tag === input || // Match by tag (username#discriminator)
          `<@${ban.user.id}>` === input // Match by mention
        );
      });

      if (!banInfo) {
        return interaction.reply({
          content: "The specified user is not banned, or the input is invalid.",
          ephemeral: true,
        });
      }

      // Unban the user
      await interaction.guild.bans.remove(banInfo.user.id, reason);

      // Reply with a success message
      const unbanSuccessEmbed = new MessageEmbed()
        .setColor("GREEN")
        .setDescription(
          `${client.emoji?.success || "✅"} | <@${
            banInfo.user.id
          }> has been unbanned.\n__**Reason:**__ ${reason}`
        );

      await interaction.reply({ embeds: [unbanSuccessEmbed] });

      // Optional: Delete reply if configured
      if (logging && logging.moderation?.delete_reply === "true") {
        setTimeout(() => {
          interaction.deleteReply().catch(() => {});
        }, 5000);
      }

      // Notify the user via DM
      const dmEmbed = new MessageEmbed()
        .setColor("GREEN")
        .setDescription(
          `You have been unbanned from **${interaction.guild.name}**.\n\n__**Moderator:**__ ${interaction.user.tag}\n__**Reason:**__ ${reason}`
        );

      banInfo.user.send({ embeds: [dmEmbed] }).catch(() => {
        console.log(`Could not send DM to ${banInfo.user.tag}`);
      });
    } catch (err) {
      console.error(err);
      interaction.reply({
        content: "An error occurred while trying to unban the user.",
        ephemeral: true,
      });
    }
  },
};
