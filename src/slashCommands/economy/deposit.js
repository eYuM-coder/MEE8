const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Profile = require("../../database/models/economy/profile");
const { parseAmount, isValidAmount, abbreviateNumber } = require("../../utils/parseAmount");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deposit")
    .setDescription("Deposit a number of money to the bank.")
    .addStringOption((option) =>
      option.setName("amount").setDescription("The amount to deposit.").setRequired(true)
    )
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),

  async execute(interaction) {
    const profile = await Profile.findOne({ userID: interaction.user.id });
    if (!profile) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.yellow)
            .setDescription(`You currently do not have a profile registered!\nUse the /register command to register your profile.`),
        ],
        ephemeral: true,
      });
    }

    const input = interaction.options.getString("amount");
    const bankSpace = profile.hasInfiniteStorage ? Infinity : profile.bankCapacity - profile.bank;

    const parsedAmount = parseAmount(input, profile.wallet);
    if (!isValidAmount(parsedAmount, profile.wallet)) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(`Please enter a valid amount to deposit.`),
        ],
        ephemeral: true,
      });
    }

    const depositAmount = Math.min(parsedAmount, bankSpace);

    if (depositAmount <= 0) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(`You cannot deposit that amount.`),
        ],
        ephemeral: true,
      });
    }

    await Profile.updateOne(
      { userID: interaction.user.id },
      { $inc: { wallet: -depositAmount, bank: depositAmount } }
    );

    const embed = new MessageEmbed();

    if (depositAmount < parsedAmount && !profile.hasInfiniteStorage) {
      embed
        .setColor(interaction.client.color.yellow)
        .setTitle(`${interaction.user.username}'s Deposit`)
        .setDescription(
          `Only part of your deposit went through.\nYou tried to deposit $${abbreviateNumber(parsedAmount)}, but only $${abbreviateNumber(depositAmount)} was deposited due to limited bank space.`
        );
    } else {
      embed
        .setColor(interaction.client.color.green)
        .setDescription(`Deposited $${abbreviateNumber(depositAmount)} to your bank.`);
    }

    await interaction.reply({ embeds: [embed] });
  },
};
