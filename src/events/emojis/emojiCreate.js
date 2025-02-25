const Event = require("../../structures/Event");
const Logging = require("../../database/schemas/logging");
const discord = require("discord.js");
const Maintenance = require("../../database/schemas/maintenance");
const send = require("../../packages/logs/index");

module.exports = class extends Event {
  async run(emoji) {
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") return;

    const logging = await Logging.findOne({ guildId: emoji.guild.id });

    if (logging) {
      if (logging.server_events.toggle == "true") {
        const channelEmbed = await emoji.guild.channels.cache.get(
          logging.server_events.channel
        );

        if (channelEmbed) {
          let color = logging.server_events.color;
          if (color == "#000000") color = emoji.client.color.green;

          if (logging.server_events.emoji_update == "true") {
            const embed = new discord.MessageEmbed()
              .setDescription(`🆕 ***Emoji Created***`)
              .addFields(
                { name: "Emoji Name", value: `${emoji.name}`, inline: true },
                { name: "Emoji", value: `${emoji}`, inline: true },
                {
                  name: "Full ID",
                  value: `\`<:${emoji.name}:${emoji.id}>\``,
                  inline: true,
                }
              )
              .setFooter({ text: `Emoji ID: ${emoji.id}` })
              .setTimestamp()
              .setColor(color);

            if (
              channelEmbed &&
              channelEmbed.viewable &&
              channelEmbed
                .permissionsFor(emoji.guild.me)
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
                }
              ).catch(() => {});
            }
          }
        }
      }
    }
  }
};
