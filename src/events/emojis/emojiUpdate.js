const Event = require("../../structures/Event");
const Logging = require("../../database/schemas/logging");
const discord = require("discord.js");
const Maintenance = require("../../database/schemas/maintenance");
const send = require("../../packages/logs/index");

module.exports = class extends Event {
  async run(oldEmoji, newEmoji) {
    const logging = await Logging.findOne({ guildId: newEmoji.guild.id });

    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") return;

    if (logging) {
      if (logging.server_events.toggle == "true") {
        const channelEmbed = await oldEmoji.guild.channels.cache.get(
          logging.server_events.channel
        );

        if (channelEmbed) {
          let color = logging.server_events.color;
          if (color == "#000000") color = oldEmoji.client.color.yellow;

          if (logging.server_events.emoji_update == "true") {
            const embed = new discord.MessageEmbed()
              .setDescription(`:pencil: ***Emoji Updated***`)
              .addFields(
                {
                  name: "Emoji Name",
                  value: `${oldEmoji.name} --> ${newEmoji.name}`,
                  inline: true,
                },
                { name: "Emoji", value: newEmoji, inline: true },
                {
                  name: "Full ID",
                  value: `\`<:${oldEmoji.name}:${oldEmoji.id}>\``,
                  inline: true,
                }
              )
              .setFooter({ text: `Emoji ID: ${oldEmoji.id}` })
              .setTimestamp()
              .setColor(color);

            if (
              channelEmbed &&
              channelEmbed.viewable &&
              channelEmbed
                .permissionsFor(newEmoji.guild.me)
                .has(["SEND_MESSAGES", "EMBED_LINKS"])
            ) {
              send(
                channelEmbed,
                { embeds: [embed] },
                {
                  name: `${this.client.user.username}`,
                  username: `${this.client.user.username}`,
                }
              ).catch(() => {});
            }
          }
        }
      }
    }
  }
};
