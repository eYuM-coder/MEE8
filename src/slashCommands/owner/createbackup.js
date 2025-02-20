const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { exec } = require("child_process");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("createbackup")
    .setDescription("Creates a backup of the bot's .env file.")
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
            ),
        ],
        ephemeral: true,
      });
    }

    await interaction
      .reply({ content: "Creating .env backup...", ephemeral: true })
      .catch((err) => console.error(err));

    // Run deployment command first
    exec("mee8 backup", (error, stdout, stderr) => {
      if (error) {
        console.error(`Backup creation error: ${error.message}`);
        return interaction.editReply({
          content: `Backup could not be created due to the following error:\n\`\`\`${
            stderr || error.message
          }\`\`\``,
          ephemeral: true,
        });
      }

      console.log(`Backup Created with these logs:\n${stdout}`);
      interaction.editReply({
        content: `Backup Created.`,
        ephemeral: true,
      });

      // Graceful restart after deployment
      setTimeout(() => {}, 3000);
    });
  },
};
