const Event = require("../../structures/Event");
const Logging = require("../../database/schemas/logging");
const discord = require("discord.js");
const Maintenance = require("../../database/schemas/maintenance");
const send = require("../../packages/logs/index");
const { AuditLogEvent } = require("discord.js");

function makehex(rgb) {
  var hex = Number(rgb).toString(16);
  if (hex.length < 2) {
    hex = "0" + hex;
  }
  return hex.padStart(6, "0");
}

module.exports = class extends Event {
  async run(oldRole, newRole) {
    if (!newRole) return;
    if (newRole.managed) return;
    let description = [];
    const logging = await Logging.findOne({ guildId: oldRole.guild.id });

    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") return;

    if (logging) {
      if (logging.server_events.toggle == "true") {
        const channelEmbed = await newRole.guild.channels.cache.get(
          logging.server_events.channel
        );

        if (channelEmbed) {
          let color = logging.server_events.color;
          if (color == "#000000") color = newRole.client.color.green;

          if (logging.server_events.role_update == "true") {
            const embed = new discord.MessageEmbed()
              .setTitle(`:pencil: ***Role Updated***`)

              .setFooter({ text: `Role ID: ${newRole.id}` })
              .setTimestamp()
              .setColor(color);

            const guild = newRole.guild;

            const fetchedLogs = await guild.fetchAuditLogs({
              type: AuditLogEvent,
              limit: 1,
            });
            const auditEntry = fetchedLogs.entries.first();
            const executor = auditEntry ? auditEntry.executor : null;

            description.push(
              `@${oldRole.name} was updated by ${executor ? executor : "Unknown"}\n`
            );

            if (oldRole.name !== newRole.name) {
              description.push(`**Name**: ${oldRole.name} --> ${newRole.name}`);
            }

            if (oldRole.color !== newRole.color) {
              description.push(
                `**Color**: #${makehex(oldRole.color)} --> #${makehex(
                  newRole.color
                )}`
              );
            }

            if (oldRole.mentionable !== newRole.mentionable) {
              description.push(
                `**Mentionable**: ${oldRole.mentionable} --> ${newRole.mentionable}`
              );
            }

            if (oldRole.hoist !== newRole.hoist) {
              description.push(
                `**Hoisted**: ${oldRole.hoist} --> ${newRole.hoist}`
              );
            }

            if (oldRole.position !== newRole.position) {
              description.push(
                `**Position**: ${oldRole.position} --> ${newRole.position}`
              );
            }

            embed.setDescription(description.join("\n"));

            if (
              channelEmbed &&
              channelEmbed.viewable &&
              channelEmbed
                .permissionsFor(newRole.guild.me)
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
