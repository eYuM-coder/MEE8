const Event = require("../../structures/Event");
const Logging = require("../../database/schemas/logging");
const discord = require("discord.js");
const Maintenance = require("../../database/schemas/maintenance");
const send = require("../../packages/logs/index");
module.exports = class extends Event {
  async run(oldGuild, newGuild) {
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") return;

    const logging = await Logging.findOne({ guildId: oldGuild.id });

    if (logging) {
      if (logging.server_events.toggle == "true") {
        const channelEmbed = await oldGuild.channels.cache.get(
          logging.server_events.channel
        );

        if (channelEmbed) {
          let color = logging.server_events.color;
          if (color == "#000000") color = oldGuild.client.color.yellow;

          if (logging.server_events.channel_created == "true") {
            const embed = new discord.MessageEmbed()
              .setDescription(`:pencil: ***Guild Updated***`)
              .setFooter({ text: `Guild ID: ${oldGuild.id}` })
              .setTimestamp()
              .setColor(color);

            if (oldGuild.name !== newGuild.name) {
              embed.addFields({
                name: "Name Update",
                value: `${oldGuild.name} --> ${newGuild.name}`,
                inline: true,
              });
            } else {
              embed.addFields({
                name: "Name Update",
                value: `Name not updated`,
                inline: true,
              });
            }

            if (oldGuild.verificationLevel !== newGuild.verificationLevel) {
              embed.addFields({
                name: "Verification Level",
                value: `${oldGuild.verificationLevel || "none"} --> ${
                  newGuild.verificationLevel || "none"
                }`,
                inline: true,
              });
            }

            if (oldGuild.icon !== newGuild.icon) {
              embed.addFields({
                name: "Icon",
                value: `[old Icon](${oldGuild.iconURL({
                  dynamic: true,
                  size: 512,
                })}) --> [new Icon](${newGuild.iconURL({
                  dynamic: true,
                  size: 512,
                })})`,
                inline: true,
              });
            }

            if (oldGuild.region !== newGuild.region) {
              embed.addFields({
                name: "region",
                value: `${oldGuild.region || "none"} --> ${
                  newGuild.region || "none"
                }`,
                inline: true,
              });
            }

            if (oldGuild.ownerID !== newGuild.ownerID) {
              embed.addFields({
                name: "Owner",
                value: `<@${oldGuild.ownerID || "none"}> **(${
                  oldGuild.ownerID
                })** --> <@${newGuild.ownerID}>**(${newGuild.ownerID})**`,
                inrole: true,
              });
            }

            if (oldGuild.afkTimeout !== newGuild.afkTimeout) {
              embed.addFields({
                name: "AFK Timeout",
                value: `${oldGuild.afkTimeout || "none"} --> ${
                  newGuild.afkTimeout || "none"
                }`,
                inline: true,
              });
            }

            if (oldGuild.afkChannelID !== newGuild.afkChannelID) {
              embed.addFields({
                name: "AFK Channel",
                value: `${oldGuild.afkChannelID || "none"}> --> ${
                  newGuild.afkChannelID || "none"
                }`,
                inline: true,
              });
            }

            if (
              channelEmbed &&
              channelEmbed.viewable &&
              channelEmbed
                .permissionsFor(newGuild.me)
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
