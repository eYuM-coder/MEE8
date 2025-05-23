const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const Profile = require("../../database/models/economy/profile");
const { parseAmount, isValidAmount, abbreviateNumber } = require("../../utils/parseAmount");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "pay",
      description: "Pay a user some money from your wallet.",
      category: "Economy",
      usage: "pay <user> <amount>",
      examples: ["pay @Peter 500"],
      cooldown: 5,
    });
  }

  async run(message, args) {
    const user = message.mentions.members.first();
        const amountInput = args.slice(1).trim().toLowerCase();
        const senderID = message.author.id;
    
        if (!user) {
          return message.channel.sendCustom({
            embeds: [
              new MessageEmbed()
                .setColor(message.client.color.red)
                .setDescription("You must mention a user to pay."),
            ],
            ephemeral: true,
          });
        }
    
        if (user.id === senderID) {
          return message.channel.sendCustom({
            embeds: [
              new MessageEmbed()
                .setColor(message.client.color.red)
                .setDescription("You can't pay yourself."),
            ],
            ephemeral: true,
          });
        }
    
        const senderProfile = await Profile.findOne({ userID: senderID });
        const recipientProfile = await Profile.findOne({ userID: user.id });
    
        if (!senderProfile) {
          return message.channel.sendCustom({
            embeds: [
              new MessageEmbed()
                .setColor(message.client.color.red)
                .setDescription("You do not have a profile. Use `/register` first."),
            ],
            ephemeral: true,
          });
        }
    
        if (!recipientProfile) {
          return message.channel.sendCustom({
            embeds: [
              new MessageEmbed()
                .setColor(message.client.color.red)
                .setDescription(`${user} does not have a profile. They should use \`/register\`.`),
            ],
            ephemeral: true,
          });
        }
    
        const amount = parseAmount(amountInput, senderProfile.wallet);
    
        if (!isValidAmount(amount, senderProfile.wallet)) {
          return message.channel.sendCustom({
            embeds: [
              new MessageEmbed()
                .setColor(message.client.color.red)
                .setDescription("Please enter a valid amount — a positive number, abbreviation, percentage, or `all`."),
            ],
            ephemeral: true,
          });
        }
    
        await Profile.updateOne({ userID: senderID }, { $inc: { wallet: -amount } });
        await Profile.updateOne({ userID: user.id }, { $inc: { wallet: amount } });
    
        return message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setColor(message.client.color.green)
              .setDescription(`You paid $${abbreviateNumber(amount)} to ${user}.`),
          ],
        });
  }
};
