const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
  .setName("m")
  .setDescription("Sends the letter m")
  .setContexts([0, 1, 2])
  .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    interaction.reply({ content: "m." });
  }
};