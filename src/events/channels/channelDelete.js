const Event = require("../../structures/Event");
const Logging = require("../../database/schemas/logging");
const discord = require("discord.js");
const send = require("../../packages/logs/index.js");
const { AuditLogEvent } = require("discord.js");
const Maintenance = require("../../database/schemas/maintenance");
module.exports = class extends Event {
  async run(message) {
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") return;

    const logging = await Logging.findOne({ guildId: message.guild.id });

    const logChannelDeletion = logging.server_events.channel_delete;
      if (!logChannelDeletion) return;

    if (logging) {
      if (logging.server_events.toggle == "true") {
        if (message.name.indexOf("Room") >= 0) return;

        const channelEmbed = await message.guild.channels.cache.get(
          logging.server_events.channel
        );

        let description = [];

        const guild = message.guild;
        const fetchedLogs = await guild.fetchAuditLogs({
          type: AuditLogEvent,
          limit: 1,
        });
        const auditEntry = fetchedLogs.entries.first();
        const executor = auditEntry ? auditEntry.executor : null;

        description.push(`The ${message.name} channel was deleted by ${executor ? executor : "Unknown"}.\n`);
        description.push(`Channel Type: ${message.type}`);
        description.push(`Channel Name: ${message.name}`);

        if (channelEmbed) {
          let color =
            logging.server_events.color === "#000000"
              ? this.client.color.red
              : logging.server_events.color;

          if (logging.server_events.channel_delete == "true") {
            const embed = new discord.MessageEmbed()
              .setTitle(`:wastebasket: ***Channel Deleted***`)
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
};
