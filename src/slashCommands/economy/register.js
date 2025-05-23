const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Profile = require("../../database/models/economy/profile");
const { createProfile } = require("../../utils/utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register your profile into the economy system!")
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    const profile = await Profile.findOne({ userID: interaction.user.id });
    if (!profile) {
      await createProfile(interaction.user);
      await interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.green)
            .setDescription(
              `Your profile has been registered successfully!\nUse the /unregister command to remove your profile.`
            ),
        ],
      });
    } else {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(
              `You already have a profile registered!\nUse the /unregister command to remove it.`
            ),
        ],
      });
    }
  },
};
