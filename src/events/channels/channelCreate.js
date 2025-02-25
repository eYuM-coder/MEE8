const Event = require("../../structures/Event");
const Logging = require("../../database/schemas/logging");
const discord = require("discord.js");
const send = require("../../packages/logs/index.js");
const Maintenance = require("../../database/schemas/maintenance");

module.exports = class extends Event {
  async run(message) {
    if (!message) return;

    const logging = await Logging.findOne({ guildId: message.guild.id });

    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") return;

    if (message.name.indexOf("Room") >= 0) return;

    if (logging) {
      if (logging.server_events.toggle == "true") {
        const channelEmbed = await message.guild.channels.cache.get(
          logging.server_events.channel
        );

        if (channelEmbed) {
          let color = logging.server_events.color;
          if (color == "#000000") color = message.client.color.green;

          if (logging.server_events.channel_created == "true") {
            if (message.type === "GUILD_TEXT") {
              const embed = new discord.MessageEmbed()
                .setDescription(`:pencil: ***Channel Created***`)
                .addFields({name:"Channel", value:`${message}`, inline:true},{name:"Channel Name", value:`${message.name}`, inline:true},{name:"Channel Type", value:"Text Channel", inline:true})
                .setFooter({ text: `Channel ID: ${message.id}` })
                .setTimestamp()
                .setColor(color);

              if (message.parent && message.type !== "GUILD_CATEGORY")
                embed.addFields({
                  name: `Parent Name`,
                  value: message.parent.name,
                });

              if (
                channelEmbed &&
                channelEmbed.viewable &&
                channelEmbed
                  .permissionsFor(message.guild.me)
                  .has(["SEND_MESSAGES", "EMBED_LINKS"])
              ) {
                send(
                  channelEmbed,
                  { embeds: [embed] },
                  {
                    name: `${this.client.user.username}`,
                    username: `${this.client.user.username}`,
                    icon: this.client.user.displayAvatarURL({
                      dynamic: true,
                      format: "png",
                    }),
                  }
                ).catch(() => {});
              }
            } else {
              const embed = new discord.MessageEmbed()
                .setDescription(`🆕 ***Channel Created***`)
                .addFields({name:"Channel Name", value:`${message.name}`, inline:true},{name:"Channel Type", value:`${message.type}`, inline:true})
                .setFooter({ text: `Channel ID: ${message.id}` })
                .setTimestamp()
                .setColor(color);

              if (
                channelEmbed &&
                channelEmbed.viewable &&
                channelEmbed
                  .permissionsFor(message.guild.me)
                  .has(["SEND_MESSAGES", "EMBED_LINKS"])
              ) {
                send(
                  channelEmbed,
                  { embeds: [embed] },
                  {
                    name: `${this.client.user.username}`,
                    username: `${this.client.user.username}`,
                    icon: this.client.user.displayAvatarURL({
                      dynamic: true,
                      format: "png",
                    }),
                  }
                ).catch(() => {});
              }
            }
          }
        }
      }
    }
  }
};
