const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { exec } = require("child_process");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Stops the bot")
    .addBooleanOption((option) =>
      option
        .setName("force")
        .setDescription("Force stop without graceful shutdown")
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("silent")
        .setDescription("Stop without logging")
        .setRequired(false)
    ),

  async execute(interaction) {
    const client = interaction.client;
    const userId = interaction.user.id;

    if (
      !client.config.owner.includes(userId) &&
      !client.config.developers.includes(userId)
    ) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(client.color.red)
            .setTitle("Access Denied")
            .setDescription(
              "You do not have permission to execute this command."
            ),
        ],
        ephemeral: true,
      });
    }

    const force = interaction.options.getBoolean("force") ?? false;
    const silent = interaction.options.getBoolean("silent") ?? false;

    const embed = new MessageEmbed()
      .setColor("#36393f")
      .setTitle("Stop Command Initiated")
      .addField("Executor", interaction.user.tag, true)
      .addField("Mode", force ? "Force Stop" : "Graceful Shutdown", true)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });

    const shutdown = async () => {
      if (!silent) {
        console.log(`Stop command executed by ${interaction.user.tag}`);
        console.log(`Options: force=${force}, silent=${silent}`);
      }

      exec("lsof -ti:4000 | xargs kill -9", async (error) => {
        if (error && !silent) {
          console.error("Port kill failed:", error);
          embed.addFields({
            name: "Port Kill Status",
            value: "Failed to kill port 4000, proceeding with shutdown",
          });
        } else if (!silent) {
          embed.addField({
            name: "Port Kill Status",
            value: "Port 4000 successfully terminated",
          });
        }

        if (!force) {
          try {
            await client.destroy();
          } catch (err) {
            if (!silent) {
              console.error("Error during client destroy:", err);
              embed.addFields({
                name: "Shutdown Status",
                value: "Error during graceful shutdown, forcing exit",
              });
            }
          }
        }

        if (!silent) {
          embed.addFields({
            name: "Final Status",
            value: "Bot shutdown complete",
          });
          await interaction.editReply({ embeds: [embed] });
        }

        process.exit(force ? 1 : 0);
      });
    };

    shutdown().catch((err) => {
      if (!silent) {
        console.error("Unexpected shutdown error:", err);
      }
      process.exit(1);
    });
  },
};
