const { SlashCommandBuilder } = require("@discordjs/builders");
const config = require("../../../config.json");
const { MessageEmbed } = require("discord.js");
const Guild = require("../../database/schemas/Guild");
async function usePrettyMs(ms) {
  const { default: prettyMilliseconds } = await import("pretty-ms");
  const time = prettyMilliseconds(ms);
  return time;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("uptime")
    .setDescription(`Sends ${config.botName}'s uptime!`)
    .setContexts(0)
    .setIntegrationTypes(0),
  async execute(interaction) {
    const guildDB = await Guild.findOne({
      guildId: interaction.guild.id,
    });
    const language = require(`../../data/language/${guildDB.language}.json`);
    let uptime = interaction.client.uptime;
    if (uptime instanceof Array) {
      uptime = uptime.reduce((max, cur) => Math.max(max, cur), -Infinity);
    }
    let formattedUptime = await usePrettyMs(uptime);
    // const date = moment().subtract(days, 'ms').format('dddd, MMMM Do YYYY');
    const embed = new MessageEmbed()
      .setDescription(
        `${config.botName} ${language.uptime1} \`${formattedUptime}\`.`
      )
      .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
      .setColor(interaction.guild.members.me.displayHexColor);
    interaction.reply({ embeds: [embed] });
  },
};
