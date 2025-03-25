const { SlashCommandBuilder } = require("@discordjs/builders");
const config = require("../../../config.json");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dashboard")
    .setDescription(
      `Need help getting to the dashboard of ${config.botName}? Use this command!`
    )
    .setContexts(0)
    .setIntegrationTypes(0),
  async execute(interaction) {
    const dashembed = new MessageEmbed()
      .setTitle(`Need ${config.botName}'s dashboard link?`)
      .setDescription(
        `Click [here](${process.env.AUTH_DOMAIN}/dashboard) to see ${config.botName}'s dashboard`
      )
      .setColor("RANDOM")
      .setFooter({ text: `Requested by ${interaction.user.username}` })
      .setTimestamp();
    interaction.reply({ embeds: [dashembed], ephemeral: true });
  },
};
