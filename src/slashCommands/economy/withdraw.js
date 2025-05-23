const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Profile = require("../../database/models/economy/profile");
const { parseAmount, isValidAmount, abbreviateNumber } = require("../../utils/parseAmount");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("withdraw")
    .setDescription("Withdraw your money from the bank to your wallet.")
    .addStringOption((option) =>
      option
        .setName("amount")
        .setDescription("The amount to withdraw (number, 'all', 'half', or e.g. '25%', '1k', '2.5m')")
        .setRequired(true)
    )
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),

  async execute(interaction) {
    const profile = await Profile.findOne({ userID: interaction.user.id });
    if (!profile) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(
              `You currently do not have a profile registered!\nUse the /register command to register your profile.`
            ),
        ],
        ephemeral: true,
      });
    }

    const input = interaction.options.getString("amount");
    const parsedAmount = parseAmount(input, profile.bank);

    if (!isValidAmount(parsedAmount, profile.bank)) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(`Invalid amount entered! Please enter a valid number, percentage, or keyword like "all" or "half".`),
        ],
        ephemeral: true,
      });
    }

    await Profile.updateOne(
      { userID: interaction.user.id },
      { $inc: { wallet: parsedAmount, bank: -parsedAmount } }
    );

    await interaction.reply({
      embeds: [
        new MessageEmbed()
          .setColor(interaction.client.color.green)
          .setDescription(`Withdrawn $${abbreviateNumber(parsedAmount)} from your bank.`),
      ],
    });
  },
};
