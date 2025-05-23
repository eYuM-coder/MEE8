const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Profile = require("../../database/models/economy/profile");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unregister")
    .setDescription("Remove your profile from the economy system!")
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    const profile = await Profile.findOne({ userID: interaction.user.id });
    if (profile) {
      await Profile.deleteOne({ userID: interaction.user.id });
      await interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.green)
            .setDescription(
              `Your profile has been removed successfully!\nUse the /register command to create a new profile.`
            ),
        ],
      });
    } else {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(
              `You don't have a profile to remove!\nUse the /register command to create one.`
            ),
        ],
      });
    }
  },
};
