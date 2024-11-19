const Command = require("../../structures/Command");

module.exports = class CreateRoleCommand extends Command {
  constructor(...args) {
    super(...args, {
      name: "createrole",
      aliases: ["cr"],
      description: "Create a role with optional settings",
      category: "Moderation",
      cooldown: 5,
      usage: '"<roleName>" [color] [hoist] [mentionable]',
      guildOnly: true,
      permissions: ["MANAGE_ROLES"],
    });
  }

  async run(message, args) {
    try {
      if (args.length === 0) {
        return message.reply("Please provide a role name!");
      }

      // Preprocess to handle quoted strings
      const fullCommand = message.content.split(" ").slice(1).join(" "); // Exclude the command name
      const match = fullCommand.match(/"([^"]+)"|(\S+)/g); // Matches quoted strings or separate arguments
      if (!match) return message.reply("Invalid input. Please use quotation marks for multi-word role names!");

      const parsedArgs = match.map((arg) => arg.replace(/^"|"$/g, "")); // Remove surrounding quotes
      const roleName = parsedArgs.shift(); // First argument is the role name

      // Validate color
      const validHex = /^#?[0-9A-Fa-f]{6}$/;
      const predefinedColors = [
        "DEFAULT", "WHITE", "AQUA", "GREEN", "BLUE", "YELLOW",
        "PURPLE", "LUMINOUS_VIVID_PINK", "GOLD", "ORANGE",
        "RED", "GREY", "DARKER_GREY", "NAVY", "DARK_AQUA",
        "DARK_GREEN", "DARK_BLUE", "DARK_PURPLE", "DARK_VIVID_PINK",
        "DARK_GOLD", "DARK_ORANGE", "DARK_RED", "DARK_GREY",
        "LIGHT_GREY", "DARK_NAVY", "BLURPLE", "GREYPLE", "DARK_BUT_NOT_BLACK",
        "NOT_QUITE_BLACK",
      ];

      let color = parsedArgs[0];
      if (color && (validHex.test(color) || predefinedColors.includes(color.toUpperCase()))) {
        color = parsedArgs.shift(); // Take the color if valid
      } else {
        color = null; // Default to null if invalid
      }

      // Validate hoist
      const hoist = parsedArgs[0]?.toLowerCase() === "true" || parsedArgs[0]?.toLowerCase() === "false" ? parsedArgs.shift() === "true" : false;

      // Validate mentionable
      const mentionable = parsedArgs[0]?.toLowerCase() === "true" || parsedArgs[0]?.toLowerCase() === "false" ? parsedArgs.shift() === "true" : false;

      const position = parsedArgs[0];

      // Create the role
      await message.guild.roles.create({
        name: roleName,
        color: color || "DEFAULT",
        hoist,
        mentionable,
        position: position,
        reason: `Role created by ${message.author.tag}`,
      });

      message.reply(`Successfully created role "${roleName}"!`);
    } catch (error) {
      console.error("Error in the createrole command:", error);
      message.reply("An error occurred while creating the role. Please try again.");
    }
  }
};
