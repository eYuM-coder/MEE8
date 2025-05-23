const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const Profile = require("../../database/models/economy/profile.js");

function abbreviateNumber(number) {
  return number >= 1e12 ? `${(number / 1e12).toFixed(2)}T` : number >= 1e9 ? `${(number / 1e9).toFixed(2)}B` : number >= 1e6 ? `${(number / 1e6).toFixed(2)}M` : number >= 1e3 ? `${(number / 1e3).toFixed(2)}K` : number.toString();
}

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "addmoney",
      aliases: ["add"],
      description: "Add money to a users wallet!",
      category: "Economy",
      usage: "<user> <amount>",
      examples: ["addmoney @Peter 400"],
      cooldown: 3,
    })
  }
  async run(message, args) {
    const user = message.mentions.members.first();
    const amount = args.slice(1).join("");
    const profile = await Profile.findOne({ userID: user.id });
    if (!profile) {
      await message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor(message.client.color.yellow)
            .setDescription(`${user} does not have a profile registered! They can use the /register command to register their profile.`)
        ]
      });
    } else {
      await Profile.updateOne({
        userID: user.id
      },
        { $inc: { wallet: amount } });
      await message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor(message.client.color.green)
            .setDescription(`Added $${abbreviateNumber(amount)} to ${user}`)
        ]
      });
    }
  }
};