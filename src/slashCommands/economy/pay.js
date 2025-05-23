const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Profile = require("../../database/models/economy/profile");
const { parseAmount, isValidAmount, abbreviateNumber } = require("../../utils/parseAmount");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pay")
    .setDescription("Pay a user some money from your wallet.")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to pay").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("amount")
        .setDescription('Amount to pay (e.g. "1234", "all", "half", "25%", "1k")')
        .setRequired(true)
    )
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),

  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const amountInput = interaction.options.getString("amount");
    const senderID = interaction.user.id;

    if (!user) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription("You must mention a user to pay."),
        ],
        ephemeral: true,
      });
    }

    if (user.id === senderID) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription("You can't pay yourself."),
        ],
        ephemeral: true,
      });
    }

    const senderProfile = await Profile.findOne({ userID: senderID });
    const recipientProfile = await Profile.findOne({ userID: user.id });

    if (!senderProfile) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription("You do not have a profile. Use `/register` first."),
        ],
        ephemeral: true,
      });
    }

    if (!recipientProfile) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(`${user} does not have a profile. They should use \`/register\`.`),
        ],
        ephemeral: true,
      });
    }

    const amount = parseAmount(amountInput, senderProfile.wallet);

    if (!isValidAmount(amount, senderProfile.wallet)) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription("Please enter a valid amount — a positive number, abbreviation, percentage, or `all`."),
        ],
        ephemeral: true,
      });
    }

    await Profile.updateOne({ userID: senderID }, { $inc: { wallet: -amount } });
    await Profile.updateOne({ userID: user.id }, { $inc: { wallet: amount } });

    return interaction.reply({
      embeds: [
        new MessageEmbed()
          .setColor(interaction.client.color.green)
          .setDescription(`You paid $${abbreviateNumber(amount)} to ${user}.`),
      ],
    });
  },
};
