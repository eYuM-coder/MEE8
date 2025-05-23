const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const Profile = require("../../database/models/economy/profile.js");

function abbreviateNumber(number) {
  return number >= 1e12 ? `${(number / 1e12).toFixed(2)}T` : number >= 1e9 ? `${(number / 1e9).toFixed(2)}B` : number >= 1e6 ? `${(number / 1e6).toFixed(2)}M` : number >= 1e3 ? `${(number / 1e3).toFixed(2)}K` : number.toString();
}

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "rob",
      description: "Rob someone!",
      category: "Economy",
      usage: "<user>",
      examples: "rob @Peter"
    })
  }
  async run(message) {
    const user = message.mentions.members.first();
    const profile = await Profile.findOne({ userID: message.author.id });
    if (!profile) {
      await message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor(message.client.color.red)
            .setDescription(`You currently do not have a profile registered!\nUse the /register command to register your profile.`)
        ]
      });
    } else {
      if (user.id == message.author.id) {
        await message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setDescription(`hey stupid, seems pretty dumb to steal from urself`)
          ]
        })
      } else if (!profile.lastRobbed) {
        await Profile.updateOne(
          { userID: message.author.id }, { $set: { lastRobbed: Date.now() } }
        );
        let amount = Math.floor(Math.random() * profile.wallet);
        await Profile.updateOne({
          userID: user.id,
        }, { $inc: { wallet: -amount } });
        await Profile.updateOne({
          userID: message.author.id,
        }, { $inc: { wallet: amount } });

        await message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setDescription(`Successfully robbed ${user} for $${abbreviateNumber(amount)}.`)
              .setColor(this.client.color.green)
              .setTimestamp()
          ]
        })
      } else if (Date.now - profile.lastRobbed > 600000) {
        await Profile.updateOne(
          { userID: message.author.id }, { $set: { lastRobbed: Date.now() } }
        );
        let amount = Math.floor(Math.random() * profile.wallet);
        await Profile.updateOne({
          userID: user.id,
        }, { $inc: { wallet: -amount } });
        await Profile.updateOne({
          userID: message.author.id,
        }, { $inc: { wallet: amount } });

        await message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setDescription(`Successfully robbed ${user} for $${abbreviateNumber(amount)}.`)
              .setColor(this.client.color.green)
              .setTimestamp()
          ]
        })
      } else {
        const lastRobbed = new Date(profile.lastRobbed);
        const timeLeft = Math.round((lastRobbed.getTime() + 600000 - Date.now()) / 1000);
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft - minutes * 60;
        await message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setColor(message.client.color.red)
              .setDescription(`You have to wait ${minutes}m ${seconds}s before you can rob someone!`)
          ]
        })
      }
    }
  }
}