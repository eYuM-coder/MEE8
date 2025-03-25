// LevelingToggleCommand.js

const Command = require("../../structures/Command");
const Guild = require("../../database/models/leveling");
let toggle = true;

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "leveltoggle",
      description: "Enable or disable leveling for this server.",
      category: "Leveling",
      cooldown: 3,
      usage: "<enable/disable>",
      args: true,
    });
  }

  async run(message, args) {
    const guildId = message.guild.id;

    if (!guildId) {
      return message.reply("Guild ID is undefined.");
    }

    // Check if args is not empty
    if (!args || args.length === 0) {
      return message.reply("Invalid action. Use `enable` or `disable`.");
    }

    const action = args[0].toLowerCase();

    try {
      let guild = await Guild.findOne({ guildId: guildId });
      if (!guild) {
        guild = new Guild({
          guildId: guildId,
          levelingEnabled: true,
          users: [],
        });
      }

    // Update the guild's levelingEnabled property
    if (action === "enable") {
      toggle = true;
      await guild.updateOne({
        levelingEnabled: toggle
      });
      message.channel.send("Leveling system enabled for this server.");
    } else if (action === "disable") {
      toggle = false;
      await guild.updateOne({
        levelingEnabled: toggle
      });
      message.channel.send("Leveling system disabled for this server.");
    } else {
      return message.reply("Invalid action. Use `enable` or `disable`.");
    }
    } catch (error) {
      console.error("Error occured: ", error);
      message.reply("An error occured while updating the leveling system.");
    }
  }
};
