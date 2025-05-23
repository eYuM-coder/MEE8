const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const Profile = require("../../database/models/economy/profile.js");

function abbreviateNumber(number) {
  return number >= 1e12 ? `${(number / 1e12).toFixed(2)}T` : number >= 1e9 ? `${(number / 1e9).toFixed(2)}B` : number >= 1e6 ? `${(number / 1e6).toFixed(2)}M` : number >= 1e3 ? `${(number / 1e3).toFixed(2)}K` : number.toString();
}

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "balance",
      aliases: ["bal"],
      description: "Check a user's balance",
      category: "Economy",
      usage: "[user]",
      examples: ["balance", "balance @Peter"],
      cooldown: 3,
    })
  }
  async run(message) {
    const user = message.mentions.members.first() || message.author;

    const profile = await Profile.findOne({
      userID: user.id
    });
    if (!profile) {
      if (user.id !== message.author.id) return message.channel.sendCustom(`${user} doesn't have a profile!`);

      await message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor(message.client.color.red)
            .setDescription(`You currently do not have a profile registered!\nUse the /register command to register your profile.`)
        ]
      });
    } else {
      const bankCapacityPercentage = (profile.bank / profile.bankCapacity) * 100;
      await message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor("BLURPLE")
            .setTitle(`${user.username}'s Balance`)
            .setDescription(`**Wallet:** $${abbreviateNumber(profile.wallet)}\n**Bank:** $${abbreviateNumber(profile.bank)}/$${abbreviateNumber(profile.bankCapacity)} (${bankCapacityPercentage.toFixed(2)}%)`)
        ]
      });
    }
  }
};