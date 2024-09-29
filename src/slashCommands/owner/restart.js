const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
  .setName("restart")
  .setDescription("Restarts the bot."),
  async execute(interaction) {
    if(!interaction.client.config.owner.includes(interaction.member.id) && interaction.client.config.developers.includes(interaction.member.id)) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
          .setColor(interaction.client.color.red)
          .setDescription(`${interaction.client.emoji.fail} | This command is for the owner.`)
        ], ephemeral: true
      })
    }
    await interaction.reply({ content: "Restarting!" })
    .catch((err) => this.client.console.error(err));
    process.exit(1);
  }
};