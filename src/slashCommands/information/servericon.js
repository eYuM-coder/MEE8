const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("servericon")
    .setDescription("Displays the icon of the current server")
    .setContexts(0)
    .setIntegrationTypes(0),
  async execute(interaction) {
    const embed = new MessageEmbed()
      .setAuthor({
        name: `${interaction.guild.name}'s Server Icon`,
        iconURL: interaction.guild.iconURL({ dynamic: true, size: 512 }),
      })
      .setImage(interaction.guild.iconURL({ dynamic: true, size: 512 }))
      .setFooter({
        text: interaction.user.tag,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp()
      .setColor(interaction.guild.me.displayHexColor);
    interaction.reply({ embeds: [embed] });
  },
};
