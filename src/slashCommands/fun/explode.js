const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("explode")
    .setDescription("Says WTF boom")
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    let embed = new MessageEmbed()
      .setDescription(`WHAT THE FU- *explosion*`)
      .setColor("RANDOM")
      .setFooter({ text: `Requested by ${interaction.user.tag}` })
      .setTimestamp();
    interaction.reply({ embeds: [embed] });
  },
};
