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

    const logChannelCreation = logging.server_events.channel_created;
    if (!logChannelCreation) return;

    if (logging) {
      if (logging.server_events.toggle == "true") {
        const channelEmbed = await message.guild.channels.cache.get(
          logging.server_events.channel
        );
        let description = [];

        if (channelEmbed) {
          let color =
            logging.server_events.color === "#000000"
              ? this.client.color.green
              : logging.server_events.color;

          const guild = message.guild;
          const fetchedLogs = await guild.fetchAuditLogs({
            type: "CHANNEL_CREATE",
            limit: 1,
          });
          const auditEntry = fetchedLogs.entries.first();
          const executor = auditEntry ? auditEntry.executor : null;

          description.push(
            `The ${message.name} channel was created by ${
              executor ? executor : "Unknown"
            }.\n`
          );
          description.push(`Channel: ${message}`);
          description.push(`Channel Type: ${message.type}`);
          description.push(`Channel Name: ${message.name}`);

          if (logging.server_events.channel_created == "true") {
            if (message.type === "GUILD_TEXT") {
              const embed = new discord.MessageEmbed()
                .setTitle(`:pencil: ***Channel Created***`)
                .setDescription(description.join("\n"))
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
                  .permissionsFor(message.guild.members.me)
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
                .setTitle(`🆕 ***Channel Created***`)
                .setDescription(description.join("\n"))
                .setFooter({ text: `Channel ID: ${message.id}` })
                .setTimestamp()
                .setColor(color);

              if (
                channelEmbed &&
                channelEmbed.viewable &&
                channelEmbed
                  .permissionsFor(message.guild.members.me)
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
