const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const Profile = require("../../database/models/economy/profile.js");
const { parseAmount, isValidAmount, abbreviateNumber } = require("../../utils/parseAmount");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "withdraw",
      aliases: ["with"],
      description: "Withdraw your bank money to your wallet.",
      category: "Economy",
      usage: "<amount>",
      examples: ["withdraw 400", "withdraw all", "withdraw half"],
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
            ephemeral: true,
          });
        }
    
        const input = args[0].toLowerCase();
        const parsedAmount = parseAmount(input, profile.bank);
    
        if (!isValidAmount(parsedAmount, profile.bank)) {
          return message.channel.sendCustom({
            embeds: [
              new MessageEmbed()
                .setColor(message.client.color.red)
                .setDescription(`Invalid amount entered! Please enter a valid number, percentage, or keyword like "all" or "half".`),
            ],
            ephemeral: true,
          });
        }
    
        await Profile.updateOne(
          { userID: message.author.id },
          { $inc: { wallet: parsedAmount, bank: -parsedAmount } }
        );
    
        await message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setColor(message.client.color.green)
              .setDescription(`Withdrawn $${abbreviateNumber(parsedAmount)} from your bank.`),
          ],
        });
  }
};
