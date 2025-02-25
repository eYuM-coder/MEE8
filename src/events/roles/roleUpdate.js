const Event = require("../../structures/Event");
const Logging = require("../../database/schemas/logging");
const discord = require("discord.js");
const Maintenance = require("../../database/schemas/maintenance");
const send = require("../../packages/logs/index");

function makehex(rgb) {
  var hex = Number(rgb).toString(16);
  if (hex.length < 2) {
    hex = "0" + hex;
  }
  return hex;
}

module.exports = class extends Event {
  async run(oldRole, newRole) {
    if (!newRole) return;
    if (newRole.managed) return;
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
              .setDescription(`:pencil: ***Role Updated***`)

              .setFooter({ text: `Role ID: ${newRole.id}` })
              .setTimestamp()
              .setColor(color);

            if (oldRole.name !== newRole.name) {
              embed.addFields({
                name: "Name Update",
                value: `${oldRole.name} --> ${newRole.name}`,
                inline: true,
              });
            } else {
              embed.addFields({
                name: "Name Update",
                value: `Name not updated`,
                inline: true,
              });
            }

            if (oldRole.color !== newRole.color) {
              embed.addFields({
                name: "Color Update",
                value: `#${makehex(oldRole.color)} --> #${makehex(
                  newRole.color
                )}`,
                inline: true,
              });
            }

            if (oldRole.mentionable !== newRole.mentionable) {
              embed.addFields({
                name: "mentionable",
                value: `${oldRole.mentionable} --> ${newRole.mentionable}`,
                inline: true,
              });
            }

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
