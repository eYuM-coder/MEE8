const Event = require("../../structures/Event");
const Logging = require("../../database/schemas/logging");
const discord = require("discord.js");
const Maintenance = require("../../database/schemas/maintenance");
const send = require("../../packages/logs/index.js");
const permissions = require("../../assets/json/channelPermissions.json");

module.exports = class extends Event {
  async run(oldChannel, newChannel) {
    const maintenance = await Maintenance.findOne({ maintenance: "maintenance" });
    if (maintenance && maintenance.toggle === "true") return;

    // Skip if the channel isn't a ticket or contains "Room"
    if (!oldChannel.name.startsWith("ticket-") || !newChannel.name.startsWith("ticket-")) {
      if (oldChannel.name.includes("Room") || newChannel.name.includes("Room")) return;

      const logging = await Logging.findOne({ guildId: newChannel.guild.id });
      if (!logging || logging.server_events.toggle !== "true") return;

      const channelEmbed = oldChannel.guild.channels.cache.get(logging.server_events.channel);
      if (!channelEmbed) return;

      const logChannelUpdate = logging.server_events.channel_update;
      if (!logChannelUpdate) return;

      const guild = newChannel.guild;
      let fetchedLogs;

      try {
        // Fetch the most recent channel update audit log
        fetchedLogs = await guild.fetchAuditLogs({ type: 'CHANNEL_OVERWRITE_UPDATE', limit: 1 });
      } catch (error) {
        console.error("Error fetching audit logs:", error);
        return;
      }

      const auditEntry = fetchedLogs?.entries?.first();
      if (!auditEntry || auditEntry.target?.id !== newChannel.id) return;

      const { executor, reason } = auditEntry;
      let description = [];
      let color = logging.server_events.color === "#000000" ? "#FFFF00" : logging.server_events.color;
      let type = newChannel.type === "GUILD_CATEGORY" ? "Category" : newChannel.type === "GUILD_TEXT" ? "Text Channel" : "Voice Channel";

      description.push(`**Channel:** ${newChannel} (${newChannel.id})`);
      description.push(`**Updated By:** ${executor.tag} (${executor.id})`);
      description.push(`**Reason:** ${reason || "No reason provided"}`);

      if (oldChannel.name !== newChannel.name) {
        description.push(`**Name:** \`${oldChannel.name}\` → \`${newChannel.name}\``);
      }
      if (oldChannel.topic !== newChannel.topic) {
        description.push(`**Topic:** \`${oldChannel.topic || "None"}\` → \`${newChannel.topic || "None"}\``);
      }
      if (oldChannel.nsfw !== newChannel.nsfw) {
        description.push(`**NSFW:** ${oldChannel.nsfw ? "Enabled" : "Disabled"} → ${newChannel.nsfw ? "Enabled" : "Disabled"}`);
      }
      if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
        description.push(`**Slowmode:** \`${oldChannel.rateLimitPerUser || "0"}s\` → \`${newChannel.rateLimitPerUser || "0"}s\``);
      }

      // Compare Permissions
      const oldPerms = oldChannel.permissionOverwrites.cache;
      const newPerms = newChannel.permissionOverwrites.cache;
      let permChanges = [];

      // Check for added or updated permissions
      newPerms.forEach((newPerm, id) => {
        const oldPerm = oldPerms.get(id);
        let changes = [];

        // Compare each permission
        Object.entries(discord.Permissions.FLAGS).forEach(([permName, flag]) => {
          const oldState = oldPerm?.allow?.has(flag) 
            ? `${this.client.emoji.success}` 
            : oldPerm?.deny?.has(flag)
            ? `${this.client.emoji.fail}` 
            : "NONE";
            
          const newState = newPerm.allow.has(flag)
            ? `${this.client.emoji.success}`
            : newPerm.deny.has(flag)
            ? `${this.client.emoji.fail}`
            : "NONE";

          if (oldState !== newState) {
            changes.push(`${permissions[permName]}: ${oldState} → ${newState}`);
          }
        });

        if (changes.length > 0) {
          permChanges.push(`**<@&${id}> / ${executor.tag}** → ${changes.join(", ")}`);
        }
      });

      // Check for removed permissions
      oldPerms.forEach((oldPerm, id) => {
        if (!newPerms.has(id)) {
          permChanges.push(`**<@&${id}> / ${executor.tag}** → Permission Removed`);
        }
      });

      if (permChanges.length > 0) {
        description.push(`**Permissions Updated:**\n${permChanges.join("\n")}`);
      }

      // Build Embed
      const embed = new discord.MessageEmbed()
        .setTitle(`:pencil: ***${type} Updated***`)
        .setFooter({ text: `Channel ID: ${newChannel.id}` })
        .setTimestamp()
        .setColor(color)
        .setDescription(description.join("\n"));

      // Send the log message
      if (channelEmbed.viewable && channelEmbed.permissionsFor(guild.me).has(["SEND_MESSAGES", "EMBED_LINKS"])) {
        send(channelEmbed, { embeds: [embed] }, {
          name: this.client.user.username,
          username: this.client.user.username,
          icon: this.client.user.displayAvatarURL({ dynamic: true, format: "png" }),
        }).catch((error) => console.error("Error sending log:", error));
      }
    }
  }
};
