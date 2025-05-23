const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const Profile = require("../../database/models/economy/profile.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "weekly",
      description: "Collect weekly coins. 7d cooldown.",
      category: "Economy",
      cooldown: 3,
    })
  }
  async run(message) {
    const profile = await Profile.findOne({
      userID: message.author.id
    });
    if (!profile) {
      await message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor(message.client.color.red)
            .setDescription(`You currently do not have a profile registered!\nUse the /register command to register your profile.`)
        ]
      });
    } else {
      if (!profile.lastWeekly) {
        await Profile.updateOne(
          { userID: message.author.id }, { $set: { lastWeekly: Date.now() } }
        );
        await Profile.updateOne({ userID: message.author.id }, { $inc: { wallet: 500000 } });
        await message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setColor(message.client.color.yellow)
              .setTitle(`${message.author.username}'s Weekly`)
              .setDescription(`You have collected this weeks earnings ($500,000).\nCome back next week to collect more`)
          ]
        });
      } else if (Date.now() - profile.lastWeekly > 604800000) {
        await Profile.updateOne(
          { userID: message.author.id }, { $set: { lastWeekly: Date.now() } }
        );
        await Profile.updateOne({ userID: message.author.id }, { $inc: { wallet: 500000 } });
        await message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setColor(message.client.color.yellow)
              .setTitle(`${message.author.username}'s Weekly`)
              .setDescription(`You have collected your weekly earnings.`)
          ]
        });
      } else {
        const lastWeekly = new Date(profile.lastWeekly);
        const timeLeft = Math.round((lastWeekly.getTime() + 604800000 - Date.now()) / 1000);
        const days = Math.floor(timeLeft / 86400);
        const hours = Math.floor((timeLeft - days * 86400) / 3600);
        const minutes = Math.floor(((timeLeft - days * 86400) - hours * 3600) / 60);
        const seconds = timeLeft - days * 86400 - hours * 3600 - minutes * 60;
        await message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setColor(message.client.color.red)
              .setTitle(`${message.author.username}'s Weekly`)
              .setDescription(`You have to wait ${days}d ${hours}h ${minutes}m ${seconds}s before you can collect your weekly earnings!`)
          ]
        })
      }
    }
  }
};