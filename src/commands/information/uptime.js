const Command = require("../../structures/Command");
const Guild = require("../../database/schemas/Guild");
const { MessageEmbed } = require("discord.js");
const config = require("../../../config.json");
async function usePrettyMs(ms) {
  const { default: prettyMilliseconds } = await import("pretty-ms");
  const time = prettyMilliseconds(ms);
  return time;
}

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "uptime",
      aliases: ["ut", "uptime"],
      cooldown: 2,
      description: `Sends you ${config.botName}'s Uptime!`,
      category: "Information",
    });
  }

  async run(message) {
    const guildDB = await Guild.findOne({
      guildId: message.guild.id,
    });
    const language = require(`../../data/language/${guildDB.language}.json`);
    let uptime = this.client.uptime;
    if (uptime instanceof Array) {
      uptime = uptime.reduce((max, cur) => Math.max(max, cur), -Infinity);
    }
    const formattedTime = await usePrettyMs(uptime);
    // const date = moment().subtract(days, 'ms').format('dddd, MMMM Do YYYY');
    const embed = new MessageEmbed()
      .setDescription(`${config.botName} ${language.uptime1} \`${formattedTime}\`.`)
      .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
      .setColor(message.guild.members.me.displayHexColor);
    message.channel.sendCustom({ embeds: [embed] });
  }
};
