const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const moment = require("moment");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "server",
      aliases: [],
      description: "Check the server",
      category: "Owner",
      userPermission: ["MANAGE_MESSAGES"],
      botPermission: ["MANAGE_MESSAGES"],
    });
  }

  async run(message, args) {
    function checkDays(date) {
      let now = new Date();
      let diff = now.getTime() - date.getTime();
      let days = Math.floor(diff / 86400000);
      return days + (days == 1 ? " day" : " days") + " ago";
    }

    const guildId = args[0];
    const guild = message.client.guilds.cache.get(guildId);
    if (!guild) return message.channel.sendCustom(`Invalid guild ID`);

    const embed = new MessageEmbed()
      .setAuthor({ name: guild.name, iconURL: guild.iconURL() })
      .addFields(
        { name: "Server ID", value: `${guild.id}`, inline: true },
        {
          name: "Total | Humans | Bots",
          value: `${guild.members.cache.size} | ${
            guild.members.cache.filter((member) => !member.user.bot).size
          } | ${guild.members.cache.filter((member) => member.user.bot).size}`,
          inline: true,
        },
        {
          name: "Verification Level",
          value: `${guild.verificationLevel}`,
          inline: true,
        },
        {
          name: "Channels",
          value: `${guild.channels.cache.size}`,
          inline: true,
        },
        { name: "Roles", value: `${guild.roles.cache.size}`, inline: true },
        {
          name: "Creation Date",
          value: `${guild.createdAt.toUTCString().substr(0, 16)} (${checkDays(
            guild.createdAt
          )})`,
          inline: true,
        }
      )
      .setThumbnail(guild.iconURL())
      .setColor(message.guild.me.displayHexColor);
    message.channel.sendCustom({ embed }).catch((error) => {
      message.channel.sendCustom(`Error: ${error}`);
    });
  }
};
