const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
  .setName("dicksize")
  .setDescription("Shows your pp size")
  .addUserOption((option) => option.setName("member").setDescription("This is optional."))
  .setContexts([0, 1, 2])
  .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    let user = interaction.options.getMember("member")

    if (!user) {
      user = interaction.user;
    }
    const size = (user.id.slice(-3) % 20) + 1;
    const sizee = size / 2.54;
    await interaction.reply({
      embeds: [
        new MessageEmbed()
        .setColor("BLURPLE")
        .setDescription(`${sizee.toFixed(2)} inch(s)\n8${"=".repeat(size)}D`)
      ]
    })
  }
}