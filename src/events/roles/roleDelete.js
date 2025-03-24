const Event = require("../../structures/Event");
const Logging = require("../../database/schemas/logging");
const discord = require("discord.js");
const Maintenance = require("../../database/schemas/maintenance");
const send = require("../../packages/logs/index");
const { AuditLogEvent } = require("discord.js");

module.exports = class extends Event {
  async run(role) {
    if (!role) return;
    if (role.managed) return;
    const logging = await Logging.findOne({ guildId: role.guild.id });

    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") return;

    if (logging) {
      if (logging.server_events.toggle == "true") {
        const channelEmbed = await role.guild.channels.cache.get(
          logging.server_events.channel
        );

        let description = [];

        const guild = role.guild;
        const fetchedLogs = await guild.fetchAuditLogs({
          type: AuditLogEvent,
          limit: 1,
        });
        const auditEntry = fetchedLogs.entries.first();
        const executor = auditEntry ? auditEntry.executor : null;

        description.push(
          `**@${role.name}** was deleted by ${
            executor ? executor : "Unknown"
          }.\n`
        );
        description.push(`Role: @${role.name}`);
        description.push(`Role Name: ${role.name}`);

        if (channelEmbed) {
          let color = logging.server_events.color;
          if (color == "#000000") color = role.client.color.red;

          if (logging.server_events.role_create == "true") {
            const embed = new discord.MessageEmbed()
              .setTitle(`🗑️ ***Role Deleted***`)
              .setDescription(description.join("\n"))
              .setFooter({ text: `Role ID: ${role.id}` })
              .setTimestamp()
              .setColor(color);

            if (
              channelEmbed &&
              channelEmbed.viewable &&
              channelEmbed
                .permissionsFor(role.guild.me)
                .has(["SEND_MESSAGES", "EMBED_LINKS"])
            ) {
              send(
                channelEmbed,
                {
                  embeds: [embed],
                },
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
