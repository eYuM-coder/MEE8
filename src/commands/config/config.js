const Command = require("../../structures/Command");
const Guild = require("../../database/schemas/Guild");
const { MessageEmbed } = require("discord.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "settings",
      aliases: ["cfg"],
      description: "Show's the current settings for this guild",
      category: "Config",
      guildOnly: true,
      userPermission: ["MANAGE_GUILD"],
    });
  }

  async run(message) {
    const guildDB = await Guild.findOne({
      guildId: message.guild.id,
    });

    const language = require(`../../data/language/${guildDB.language}.json`);
    await message.channel.sendCustom({
      embeds: [
        new MessageEmbed()
          .setColor(message.guild.members.me.displayHexColor)
          .setTitle(`${language.serversettings1}`)
          .addFields(
            {
              name: `Main Settings`,
              value: `[\`Click here\`](${process.env.AUTH_DOMAIN}/dashboard/${message.guild.id})`,
              inline: true,
            },
            {
              name: `Welcome & Leave`,
              value: `[\`Click here\`](${process.env.AUTH_DOMAIN}/dashboard/${message.guild.id}/welcome)`,
              inline: true,
            },
            {
              name: `Logging`,
              value: `[\`Click here\`](${process.env.AUTH_DOMAIN}/dashboard/${message.guild.id}/logging)`,
              inline: true,
            },
            {
              name: `Autorole`,
              value: `[\`Click here\`](${process.env.AUTH_DOMAIN}/dashboard/${message.guild.id}/autorole)`,
              inline: true,
            },
            {
              name: `Alt Detector`,
              value: `[\`Click here\`](${process.env.AUTH_DOMAIN}/dashboard/${message.guild.id}/altdetector)`,
              inline: true,
            },
            {
              name: `Tickets`,
              value: `[\`Click here\`](${process.env.AUTH_DOMAIN}/dashboard/${message.guild.id}/tickets)`,
              inline: true,
            },
            {
              name: `Suggestions`,
              value: `[\`Click here\`](${process.env.AUTH_DOMAIN}/dashboard/${message.guild.id}/Suggestions)`,
              inline: true,
            },
            {
              name: `Server Reports`,
              value: `[\`Click here\`](${process.env.AUTH_DOMAIN}/dashboard/${message.guild.id}/reports)`,
              inline: true,
            },
            {
              name: `Automod`,
              value: `[\`Click here\`](${process.env.AUTH_DOMAIN}/dashboard/${message.guild.id}/automod)`,
              inline: true,
            }
          )

          .setFooter({ text: `${message.guild.name}` }),
      ],
    });
  }
};
