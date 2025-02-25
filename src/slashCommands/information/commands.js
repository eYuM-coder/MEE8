const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("commands")
    .setDescription("Shows the bot's subcommands and subcommand groups"),
  async execute(interaction) {
    try {
      // Ensure slashCommands exists
      if (!interaction.client.slashCommands) {
        throw new Error("Slash commands collection is not available.");
      }

      // Extract all subcommands and subcommand groups
      const commandsList = Array.from(
        interaction.client.slashCommands.values()
      ).flatMap((cmd) => {
        if (!cmd.data.options) return [];

        return cmd.data.options.flatMap((option) => {
          if (option.type === undefined && !option.options) {
            // Direct subcommand (e.g., `/command subcommand`)
            return {
              type: "subcommand",
              name: `${cmd.data.name} ${option.name}`,
            };
          } else if (option.type === undefined && option.options) {
            // Subcommand group (e.g., `/command group subcommand`)
            return {
              type: "group",
              name: `${cmd.data.name} ${option.name}`,
              subcommands: option.options.filter((option) => option.type == undefined)
                .map((subOption) => subOption.name),
            };
          }
          return [];
        });
      });

      // Format the output
      const formattedOutput = commandsList
        .map((item) => {
          if (item.type === "group") {
            return `**${item.name}**\n${item.subcommands
              .map((sub) => `  └ ${sub}`)
              .join("\n")}`;
          } else if (item.type === "subcommand") {
            return `**${item.name}**`;
          }
          return "";
        })
        .join("\n");

      // Send the result in an embed
      const embed = new MessageEmbed()
        .setTitle("Available Subcommands and Subcommand Groups")
        .setDescription(
          commandsList.length > 0
            ? `Here are all the subcommands and subcommand groups:\n${formattedOutput}`
            : "No subcommands or subcommand groups found."
        )
        .setColor("#00FF00");

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error fetching subcommands and subcommand groups:", error);
      await interaction.reply({
        content:
          "An error occurred while fetching subcommands and subcommand groups.",
        ephemeral: true,
      });
    }
  },
};
