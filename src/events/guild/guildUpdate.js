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

        let description = [];

        const guild = newGuild.guild;
        const fetchedLogs = await guild.fetchAuditLogs({
          type: "GUILD_UPDATE",
          limit: 1,
        });
        const auditEntry = fetchedLogs.entries.first();
        const executor = auditEntry ? auditEntry.executor : null;

        description.push(
          `The guild ${oldGuild.name} was updated by ${
            executor ? executor : "Unknown"
          }.\n`
        );

        if (channelEmbed) {
          let color =
            logging.server_events.color === "#000000"
              ? this.client.color.yellow
              : logging.server_events.color;

          if (logging.server_events.channel_created == "true") {
            const embed = new discord.MessageEmbed()
              .setTitle(`:pencil: ***Guild Updated***`)
              .setFooter({ text: `Guild ID: ${oldGuild.id}` })
              .setTimestamp()
              .setColor(color);

            if (oldGuild.name !== newGuild.name) {
              description.push(`Name: ${oldGuild.name} --> ${newGuild.name}`);
            }
            if (oldGuild.verificationLevel !== newGuild.verificationLevel) {
              description.push(
                `Verification Level: ${
                  oldGuild.verificationLevel || "none"
                } --> ${newGuild.verificationLevel || "none"}`
              );
            }

            if (oldGuild.icon !== newGuild.icon) {
              description.push(
                `Icon: [Old icon](${oldGuild.iconURL({
                  dynamic: true,
                  size: 512,
                })}) --> [New icon](${newGuild.iconURL({
                  dynamic: true,
                  size: 512,
                })})`
              );
            }

            if (oldGuild.region !== newGuild.region) {
              description.push(
                `Region: ${oldGuild.region || "none"} --> ${
                  newGuild.region || "none"
                }`
              );
            }

            if (oldGuild.ownerID !== newGuild.ownerID) {
              description.push(
                `Owner: <@${oldGuild.ownerID || "none"}> **(${
                  oldGuild.ownerID
                })** --> <@${newGuild.ownerID}>**(${newGuild.ownerID})**`
              );
            }

            if (oldGuild.afkTimeout !== newGuild.afkTimeout) {
              description.push(
                `AFK Timeout: ${oldGuild.afkTimeout || "none"} --> ${
                  newGuild.afkTimeout || "none"
                }`
              );
            }

            if (oldGuild.afkChannelID !== newGuild.afkChannelID) {
              description.push(
                `AFK Channel: ${oldGuild.afkChannelID || "none"}> --> ${
                  newGuild.afkChannelID || "none"
                }`
              );
            }

            embed.setDescription(description.join("\n"));

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
