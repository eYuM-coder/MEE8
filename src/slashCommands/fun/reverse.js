const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Guild = require("../../database/schemas/Guild");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reverse")
    .setDescription("Reverses a message")
    .addStringOption((option) => option.setName("message").setDescription("The message to reverse").setRequired(true))
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    const text = interaction.options.getString("message")
    const converted = text.split("").reverse().join("");
    interaction.reply({
      embeds: [
        new MessageEmbed()
          .setDescription(`\u180E${converted}`)
          .setColor(interaction.client.color.blue)
      ]
    })
      .catch(() => { });
  }
};