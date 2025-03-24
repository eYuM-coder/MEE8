const Event = require("../../structures/Event");
const Discord = require("discord.js");
const logger = require("../../utils/logger");
const Guild = require("../../database/schemas/Guild");
const Logging = require("../../database/schemas/logging");
const config = require("../../../config.json");
const welcomeClient = new Discord.WebhookClient({
  url: config.webhooks.leavesPublic,
});
const webhookClient = new Discord.WebhookClient({
  url: config.webhooks.leavesPrivate,
});
module.exports = class extends Event {
  async run(guild) {
    if (guild.name === undefined) return;
    Guild.findOneAndDelete(
      {
        guildId: guild.id,
      },
      (err) => {
        if (err) console.log(err);
        logger.info(`Left from "${guild.name}" (${guild.id})`, {
          label: "Guilds",
        });
      }
    );

    const welcomeEmbed = new Discord.MessageEmbed()
      .setColor(this.client.color.red)
      .setTitle("Leave Server")
      .setThumbnail(`${process.env.AUTH_DOMAIN}/logo`)
      .setDescription(`${config.botName} left a server!`)
      .addFields(
        { name: `Server Name`, value: `\`${guild.name}\``, inline: true },
        { name: `Server ID`, value: `\`${guild.id}\``, inline: true }
      )
      .setFooter({
        text: `${this.client.guilds.cache.size} guilds `,
        iconURL: `${process.env.AUTH_DOMAIN}/logo.png`,
      });

    welcomeClient.sendCustom({
      username: `${config.botName}`,
      avatarURL: `${process.env.AUTH_DOMAIN}/logo.png`,
      embeds: [welcomeEmbed],
    });

    Logging.findOneAndDelete({
      guildId: guild.id,
    }).catch(() => {});

    const embed = new Discord.MessageEmbed()
      .setColor(this.client.color.red)
      .setDescription(`I have left the ${guild.name} server.`)
      .setFooter({
        text: `Lost ${guild.members.cache.size - 1} members • I'm now in ${
          this.client.guilds.cache.size
        } servers..\n\nID: ${guild.id}`,
      })
      .setThumbnail(
        guild.iconURL({ dynamic: true })
          ? guild.iconURL({ dynamic: true })
          : `https://guild-default-icon.herokuapp.com/${encodeURIComponent(
              guild.name
            )}`
      )
      .addFields({
        name: "Server Owner",
        value: `${guild.owner} / ${guild.ownerID}`,
      });

    webhookClient.sendCustom({
      username: `${this.client.user.username}`,
      avatarURL: `${process.env.AUTH_DOMAIN}/logo.png`,
      embeds: [embed],
    });
  }
};
