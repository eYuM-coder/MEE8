const Event = require("../../structures/Event");
const Logging = require("../../database/schemas/logging");
const discord = require("discord.js");
const Maintenance = require("../../database/schemas/maintenance");
const send = require("../../packages/logs/index.js");

module.exports = class extends Event {
  async run(oldChannel, newChannel) {
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });
    if (maintenance && maintenance.toggle == "true") return;

    if (
      !oldChannel.name.startsWith("ticket-") ||
      !newChannel.name.startsWith("ticket-")
    ) {
      if (oldChannel.name.includes("Room") || newChannel.name.includes("Room"))
        return;

      const logging = await Logging.findOne({ guildId: newChannel.guild.id });
      if (!logging || logging.server_events.toggle !== "true") return;

      const channelEmbed = oldChannel.guild.channels.cache.get(
        logging.server_events.channel
      );
      if (!channelEmbed) return;

      let color =
        logging.server_events.color === "#000000"
          ? this.client.color.yellow
          : logging.server_events.color;
      let type =
        newChannel.type === "GUILD_CATEGORY"
          ? "Category"
          : newChannel.type === "GUILD_TEXT"
          ? "Text Channel"
          : "Voice Channel";

      if (logging.server_events.channel_created === "true") {
        const embed = new discord.MessageEmbed()
          .setDescription(`:pencil: ***${type} Updated***`)
          .addFields({ name: "Channel", value: `${newChannel}`, inline: true })
          .setFooter({ text: `Channel ID: ${newChannel.id}` })
          .setTimestamp()
          .setColor(color);

        if (oldChannel.name !== newChannel.name) {
          embed.addFields({
            name: "Name Update",
            value: `${oldChannel.name} --> ${newChannel.name}`,
            inline: true,
          });
        }

        if (oldChannel.topic !== newChannel.topic) {
          embed.addFields({
            name: "Topic",
            value: `${oldChannel.topic || "none"} --> ${
              newChannel.topic || "none"
            }`,
          });
        }

        if (oldChannel.nsfw !== newChannel.nsfw) {
          embed.addFields({
            name: "NSFW",
            value: `${oldChannel.nsfw} --> ${newChannel.nsfw}`,
          });
        }

        if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
          embed.addFields({
            name: "Slowmode",
            value: `${oldChannel.rateLimitPerUser} --> ${newChannel.rateLimitPerUser}`,
          });
        }

        // Check for permission updates
        const oldPerms = oldChannel.permissionOverwrites.cache;
        const newPerms = newChannel.permissionOverwrites.cache;
        let permChanges = [];

        newPerms.forEach((perm, id) => {
          const oldPerm = oldPerms.get(id);
          let changes = [];

          discord.Permissions.FLAGS.forEach((flag, permName) => {
            const oldState = oldPerm
              ? oldPerm.allow.has(flag)
                ? "ALLOWED"
                : oldPerm.deny.has(flag)
                ? "DENIED"
                : "NONE"
              : "NONE";
            const newState = perm.allow.has(flag)
              ? "ALLOWED"
              : perm.deny.has(flag)
              ? "DENIED"
              : "NONE";
            if (oldState !== newState) {
              changes.push(`${permName}: ${oldState} → ${newState}`);
            }
          });

          if (changes.length > 0) {
            permChanges.push(`<@&${id}> / <@${id}> → ${changes.join(", ")}`);
          }
        });

        oldPerms.forEach((perm, id) => {
          if (!newPerms.has(id)) {
            permChanges.push(`Removed: <@&${id}> / <@${id}>`);
          }
        });

        if (permChanges.length > 0) {
          embed.addFields({
            name: "Permissions Updated",
            value: permChanges.join("\n"),
          });
        }

        if (
          channelEmbed.viewable &&
          channelEmbed
            .permissionsFor(newChannel.guild.me)
            .has(["SEND_MESSAGES", "EMBED_LINKS"])
        ) {
          send(
            channelEmbed,
            { embeds: [embed] },
            {
              name: this.client.user.username,
              username: this.client.user.username,
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
};
