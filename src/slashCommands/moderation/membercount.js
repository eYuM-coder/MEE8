const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Guild = require("../../database/schemas/Guild");
const ReactionMenu = require("../../data/ReactionMenu.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("membercount")
    .setDescription("Displays the member count of the server")
    .setContexts(0)
    .setIntegrationTypes(0),
  async execute(interaction) {
    const guildDB = await Guild.findOne({
      guildId: interaction.guild.id,
    });

    const members = interaction.guild.members.cache.size;

    const embed = new MessageEmbed()
      .setTitle(`Members`)
      .setFooter({
        text: interaction.user.tag,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setDescription(`${members}`)
      .setTimestamp()
      .setColor(interaction.guild.me.displayHexColor);

    return interaction.reply({ embeds: [embed] });
  },
};
