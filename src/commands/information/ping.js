const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const { stripIndent } = require("common-tags");
const Guild = require("../../database/schemas/Guild");
module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "ping",
      aliases: ["latency"],
      description: "Check's Neonova's latency",
      category: "Information",
      cooldown: 5,
    });
  }

  async run(message) {
    const guildDB = await Guild.findOne({
      guildId: message.guild.id,
    });

    const language = require(`../../data/language/${guildDB.language}.json`);

    const embed = new MessageEmbed()
      .setDescription(`\`${language.pinging}\``)
      .setColor(message.guild.me.displayHexColor)
      .setFooter({ text: `Powered by ${process.env.AUTH_DOMAIN}` });

    const msg = await message.channel.sendCustom({ embeds: [embed] });

    const latency = msg.createdTimestamp - message.createdTimestamp;

    let koko = stripIndent`
**${language.timeTaken}** \`${latency}ms\`
**${language.discordAPI}** \`${Math.round(this.client.ws.ping)}ms\`
`;

    let color = message.guild.me.displayHexColor;
    if (latency < 100) {
      color = `#00ff00`;
    } else if (latency > 100 && latency < 200) {
      color = `#CCCC00`;
    } else if (latency > 200) {
      color = message.client.color.red;
    } else color = message.guild.me.displayHexColor;

    embed.setDescription(`${koko}`);
    embed.setColor(color);
    msg.edit({ embeds: [embed] });
  }
};
