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
      if (oldChannel.name.indexOf("Room") >= 0) return;
      if (newChannel.name.indexOf("Room") >= 0) return;

      const logging = await Logging.findOne({ guildId: newChannel.guild.id });

      if (logging) {
        if (logging.server_events.toggle == "true") {
          const channelEmbed = await oldChannel.guild.channels.cache.get(
            logging.server_events.channel
          );

          if (channelEmbed) {
            let color = logging.server_events.color;
            if (color == "#000000") color = this.client.color.yellow;

            let type;

            if (newChannel.type === "GUILD_CATEGORY") type = "Category";
            if (newChannel.type === "GUILD_TEXT") type = "Text Channel";
            if (newChannel.type === "GUILD_VOICE") type = "Voice Channel";

            if (logging.server_events.channel_created == "true") {
              const embed = new discord.MessageEmbed()
                .setDescription(`:pencil: ***${type} Updated***`)
                .addFields({name:"Channel", value:`${newChannel}`, inline:true})
                .setFooter({ text: `Channel ID: ${newChannel.id}` })
                .setTimestamp()
                .setColor(color);

              if (oldChannel.name !== newChannel.name) {
                embed.addFields({
                  name: "Name Update",
                  value: `${oldChannel.name} --> ${newChannel.name}`,
                  inline: true,
                });
              } else {
                embed.addFields({
                  name: "Name Update",
                  value: `Name not updated`,
                  inline: true,
                });
              }

              if (oldChannel.topic || newChannel.topic) {
                if (oldChannel.topic !== newChannel.topic) {
                  embed.addFields({
                    name: "Topic",
                    value: `${oldChannel.topic || "none"} --> ${
                      newChannel.topic || "none"
                    }`,
                  });
                }
              }

              if (oldChannel.nsfw || newChannel.nsfw) {
                if (oldChannel.nsfw !== newChannel.nsfw) {
                  embed.addFields({
                    name: "NSFW",
                    value: `${oldChannel.nsfw} --> ${newChannel.nsfw}`,
                  });
                }
              }

              if (oldChannel.rateLimitPerUser || newChannel.rateLimitPerUser) {
                if (
                  oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser
                ) {
                  embed.addFields({
                    name: "Slowmode",
                    value: `${oldChannel.rateLimitPerUser} --> ${newChannel.rateLimitPerUser}`,
                  });
                }
              }

              if (oldChannel.rateLimitPerUser === newChannel.rateLimitPerUser) {
                if (oldChannel.name === newChannel.name) {
                  if (oldChannel.topic === newChannel.topic) {
                    if (oldChannel.nsfw === newChannel.nsfw) {
                      return;
                    }
                  }
                }
              }

              if (
                channelEmbed &&
                channelEmbed.viewable &&
                channelEmbed
                  .permissionsFor(newChannel.guild.me)
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
  }
};
