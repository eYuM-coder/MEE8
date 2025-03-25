const Command = require("../../structures/Command");
const Guild = require("../../database/schemas/Guild");
const { MessageEmbed } = require("discord.js");

module.exports = class ToggleCategoryCommand extends Command {
  constructor(...args) {
    super(...args, {
      name: "togglecategory",
      description: "Disable or enable a category in the guild",
      category: "Config",
      examples: ["togglecategory Economy", "togglecategory Reaction Role"],
      cooldown: 3,
      guildOnly: true,
      userPermissions: ["MANAGE_GUILD"],
    });
  }

  async run(message, args) {
    try {
      // Validate input
      if (!args.length) {
        return message.channel.sendCustom(
          "Please specify a category to toggle!"
        );
      }

      const guildDB =
        (await Guild.findOne({ guildId: message.guild.id })) ||
        new Guild({ guildId: message.guild.id });

      const { success, fail } = message.client.emoji;

      // Get full category name, joining all args
      const inputCategory = args.join(" ");
      const type = inputCategory.toLowerCase();

      // Prevent disabling config category
      if (type === "config") {
        return message.channel.sendCustom(
          `${fail} You may not disable the Configuration Category.`
        );
      }

      // Get valid categories
      const validCategories = message.client.utils.removeDuplicates(
        message.client.botCommands
          .filter((cmd) => cmd.category !== "Owner")
          .map((cmd) => cmd.category)
      );

      // Find matching category (case-insensitive)
      const matchedCategory = validCategories.find(
        (cat) => cat.toLowerCase() === type
      );

      // Validate category
      if (!matchedCategory) {
        return message.channel.sendCustom(
          `Please provide a valid category.\n\n**Available Categories:**\n${validCategories.join(
            " - "
          )}`
        );
      }

      // Find commands in the specified category
      const categoryCommands = message.client.botCommands.filter(
        (cmd) => cmd.category === matchedCategory
      );

      // Ensure disabledCommands is an array
      let disabledCommands = Array.isArray(guildDB.disabledCommands)
        ? guildDB.disabledCommands
        : (guildDB.disabledCommands || "").split(" ").filter(Boolean);

      let description;
      const allDisabled = categoryCommands.every((cmd) =>
        disabledCommands.includes(cmd.name)
      );

      if (allDisabled) {
        // Enable all commands in the category
        disabledCommands = disabledCommands.filter(
          (cmd) => !categoryCommands.some((catCmd) => catCmd.name === cmd)
        );
        description = `All \`${matchedCategory}\` commands have been successfully **enabled**. ${success}`;
      } else {
        // Disable all commands in the category
        categoryCommands.forEach((cmd) => {
          if (!disabledCommands.includes(cmd.name)) {
            disabledCommands.push(cmd.name);
          }
        });
        description = `All \`${matchedCategory}\` commands have been successfully **disabled**. ${fail}`;
      }

      // Save updated disabled commands
      guildDB.disabledCommands = disabledCommands;
      await guildDB.save().catch((error) => {
        console.error("Failed to save guild settings:", error);
      });

      // Prepare disabled commands list
      const disabledList =
        disabledCommands.length > 0
          ? disabledCommands.map((cmd) => `\`${cmd}\``).join(" ")
          : "`None`";

      // Create embed
      const embed = new MessageEmbed()
        .setAuthor({
          name: message.author.tag,
          iconURL: message.guild.iconURL({ dynamic: true }) || undefined,
        })
        .setDescription(description)
        .addFields({
          name: "Disabled Commands",
          value:
            disabledList.length > 1024
              ? "[Too Large to Display]"
              : disabledList,
          inline: true,
        })
        .setFooter({ text: "https://neonova.eyum.org/" })
        .setTimestamp()
        .setColor(message.client.color.green);

      // Send embed
      await message.channel.sendCustom({ embeds: [embed] });
    } catch (error) {
      console.error("Error in togglecategory command:", error);
      message.channel.sendCustom(
        "An unexpected error occurred while processing the command."
      );
    }
  }
};
