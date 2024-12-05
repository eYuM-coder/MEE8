const Command = require("../../structures/Command");
const Guild = require("../../database/models/leveling");
module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "setbackground",
      description: "Set your preferred background.",
      category: "Leveling",
      cooldown: 3,
      usage: "<background URL>",
      guildOnly: true,
    });
  }

  async run(message, args) {
    const backgroundURL = args[0];
    const targetUser = message.mentions.users.first() || message.author;
    const guildId = message.guild.id;

    if (!backgroundURL) {
      return message.reply("Please provide a background URL.");
    }

    try {
      const guild = await Guild.findOne({ guildId: guildId });

      if (guild && !guild.levelingEnabled) {
        return message.reply("Leveling is disabled for this server.");
      }

      let user = await guild.users.find((u) => u.userId === targetUser.id);

      if (!user) {
        return message.reply("This user does not have a level profile!");
      } else {
        user.background = backgroundURL;
      }

      await guild.save();

      message.reply(`Your background has been set to: ${backgroundURL}`);
    } catch (error) {
      console.error("Error occurred:", error);
      message.reply("An error occurred while setting the background.");
    }
  }
};
