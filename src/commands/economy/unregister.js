const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const Profile = require("../../database/models/economy/profile");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "unregister",
      description: "Removes your profile from the economy system.",
      category: "Economy",
      cooldown: 5,
    });
  }
  async run(message) {
    const profile = await Profile.findOne({ userID: message.author.id });
    if (profile) {
      await Profile.deleteOne({ userID: message.author.id });
      await message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor(message.client.color.green)
            .setDescription(
              `Your profile has been removed successfully!\nUse the /register command to create a new profile.`
            ),
        ],
      });
    } else {
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor(message.client.color.red)
            .setDescription(
              `You don't have a profile to remove!\nUse the /register command to create one.`
            ),
        ],
      });
    }
  }
};
