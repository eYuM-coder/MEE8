const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { exec } = require("child_process");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("restart")
    .setDescription("Restarts the bot.")
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    if (
      !interaction.client.config.owner.includes(interaction.user.id) &&
      !interaction.client.config.developers.includes(interaction.user.id)
    ) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(
              `${interaction.client.emoji.fail} | This command is for the owner.`
            )
        ],
        ephemeral: true,
      });
    }

    await interaction.reply({ content: "Deploying and restarting...", ephemeral: true })
      .catch((err) => console.error(err));

    // Run deployment command first
    exec("mee8 deploy", (error, stdout, stderr) => {
      if (error) {
        console.error(`Deployment error: ${error.message}`);
        return interaction.editReply({
          content: `Deployment failed:\n\`\`\`${stderr || error.message}\`\`\``,
          ephemeral: true,
        });
      }

      console.log(`Deployment output:\n${stdout}`);
      interaction.editReply({
        content: `Deployment successful:\n\`\`\`${stdout}\`\`\`\nRestarting...`,
        ephemeral: true,
      });

      // Graceful restart after deployment
      setTimeout(() => process.exit(0), 3000);
    });
  },
};
