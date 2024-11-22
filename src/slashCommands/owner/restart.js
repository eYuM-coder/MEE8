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
    if (!interaction.client.config.owner.includes(interaction.user.id) && interaction.client.config.developers.includes(interaction.user.id)) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(`${interaction.client.emoji.fail} | This command is for the owner.`)
        ], ephemeral: true
      })
    }
    await interaction.reply({ content: "Restarting!", ephemeral: true })
      .catch((err) => this.client.console.error(err));
      exec("npm start", (error, stdout) => {
        const response = stdout || error;
        interaction.editReply({ content: `${response}`, ephemeral: true })
      })
    process.exit(1);
  }
};