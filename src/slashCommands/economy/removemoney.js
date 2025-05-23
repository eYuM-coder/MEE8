const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Profile = require("../../database/models/economy/profile");

function abbreviateNumber(number) {
  return number >= 1e12
    ? `${(number / 1e12).toFixed(2)}T`
    : number >= 1e9
    ? `${(number / 1e9).toFixed(2)}B`
    : number >= 1e6
    ? `${(number / 1e6).toFixed(2)}M`
    : number >= 1e3
    ? `${(number / 1e3).toFixed(2)}K`
    : number.toString();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removemoney")
    .setDescription("Remove money from a user's wallet")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to remove the money from")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("amount")
        .setDescription("The amount to remove")
        .setRequired(true)
    )
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    const user = interaction.options.getUser("user");

    if (!user) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription("Please mention a valid user!"),
        ],
      });
    }
    const amount = interaction.options.getString("amount");
    const profile = await Profile.findOne({ userID: user.id });
    if (!profile) {
      await interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(message.client.color.red)
            .setDescription(
              `${user} does not have a profile registered! They can use the /register command to register their profile.`
            ),
        ],
        ephemeral: true,
      });
    } else {
      if (profile.wallet === 0) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(message.client.color.red)
              .setDescription(
                `${user} does not have any money in their wallet to remove.`
              ),
          ],
        });
      }

      await Profile.updateOne(
        {
          userID: user.id,
        },
        {
          $inc: { wallet: -amount },
        }
      );

      await interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.green)
            .setDescription(
              `Removed $${abbreviateNumber(amount)} from ${user}.`
            ),
        ],
      });
    }
  },
};
