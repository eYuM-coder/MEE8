const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const Profile = require("../../database/models/economy/profile.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "monthly",
      description: "Collect monthly coins. 30d cooldown.",
      category: "Economy",
      cooldown: 3,
    })
  }
  async run(message) {
    const profile = await Profile.findOne({
      userID: message.author.id
    });
    if (!profile) {
      await createProfile(message.author);
      await message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor(message.client.color.red)
            .setDescription(`You currently do not have a profile registered!\nUse the /register command to register your profile.`)
        ]
      });
    } else {
      if (!profile.lastMonthly) {
        await Profile.updateOne(
          { userID: message.author.id }, { $set: { lastMonthly: Date.now() } }
        );
        await Profile.updateOne({ userID: message.author.id }, { $inc: { wallet: 2500000 } });
        await message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setColor(message.client.color.green)
              .setTitle(`${message.author.username}'s Monthly`)
              .setDescription(`You have collected this month's earnings ($2,500,000).\nCome back next month to collect more`)
          ]
        });
      } else if (Date.now() - profile.lastMonthly > 2592000000) {
        await Profile.updateOne(
          { userID: message.author.id }, { $set: { lastMonthly: Date.now() } }
        );
        await Profile.updateOne({ userID: message.author.id }, { $inc: { wallet: 2500000 } });
        await message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setColor(message.client.color.green)
              .setTitle(`${message.author.username}'s Monthly`)
              .setDescription(`You have collected your monthly earnings of $2,500,000.`)
          ]
        });
      } else {
        const lastMonthly = new Date(profile.lastMonthly);
        const timeLeft = Math.round((lastMonthly.getTime() + 2592000000 - Date.now()) / 1000);
        const days = Math.floor(timeLeft / 86400);
        const hours = Math.floor((timeLeft - days * 86400) / 3600);
        const minutes = Math.floor(((timeLeft - days * 86400) - hours * 3600) / 60);
        const seconds = timeLeft - days * 86400 - hours * 3600 - minutes * 60;
        await message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setColor(message.client.color.red)
              .setTitle(`${message.author.username}'s Monthly`)
              .setDescription(`You have to wait ${days}d ${hours}h ${minutes}m ${seconds}s before you can collect your monthly earnings!`)
          ]
        })
      }
    }
  }
};