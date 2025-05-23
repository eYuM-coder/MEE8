const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const Profile = require("../../database/models/economy/profile.js");
const { parseAmount, isValidAmount, abbreviateNumber } = require("../../utils/parseAmount.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "deposit",
      aliases: ["dep"],
      description: "Deposit your wallet money to the bank.",
      category: "Economy",
      usage: "<amount>",
      examples: ["dep 400", "dep all", "dep half"],
      cooldown: 3,
    });
  }

  async run(message, args) {
    const profile = await Profile.findOne({ userID: message.author.id });
    if (!profile) {
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor(message.client.color.red)
            .setDescription(
              `You currently do not have a profile registered!\nUse the /register command to register your profile.`
            ),
        ],
      });
    }

    const input = args[0]?.toLowerCase();
    if (!input) {
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor(message.client.color.red)
            .setDescription(`Please specify an amount to deposit (number, "all", or "half").`),
        ],
      });
    }

    const hasInfinite = profile.hasInfiniteStorage;
    const remainingSpace = hasInfinite ? Infinity : profile.bankCapacity - profile.bank;

    const parsedAmount = parseAmount(input, profile.wallet);
    if (!isValidAmount(parsedAmount, profile.wallet)) {
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
          .setColor(message.client.color.red)
          .setDescription(`Please enter a valid amount to deposit.`)
        ]
      });
    }

    const depositAmount = Math.min(parsedAmount, bankSpace);

    if (depositAmount <= 0) {
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
          .setColor(message.client.color.red)
          .setDescription(`You cannot deposit that amount.`)
        ]
      })
    }

    await Profile.updateOne(
      { userID: message.author.id },
      { $inc: { wallet: -depositAmount, bank: depositAmount } }
    );

    const embed = new MessageEmbed();

    if (depositAmount < parsedAmount && !profile.hasInfiniteStorage) {
          embed
            .setColor(message.client.color.yellow)
            .setTitle(`${message.author.username}'s Deposit`)
            .setDescription(
              `Only part of your deposit went through.\nYou tried to deposit $${abbreviateNumber(parsedAmount)}, but only $${abbreviateNumber(depositAmount)} was deposited due to limited bank space.`
            );
        } else {
          embed
            .setColor(message.client.color.green)
            .setDescription(`Deposited $${abbreviateNumber(depositAmount)} to your bank.`);
        }
    
        await message.channel.sendCustom({ embeds: [embed] });
  }
};
