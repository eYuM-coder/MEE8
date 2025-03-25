const Event = require("../../structures/Event");
const { MessageEmbed } = require("discord.js");
require("moment-duration-format");
const Logging = require("../../database/schemas/logging");
const Maintenance = require("../../database/schemas/maintenance");
const send = require("../../packages/logs/index");

module.exports = class extends Event {
  async run(messages) {
    const message = messages.first();

    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") return;

    const logging = await Logging.findOne({ guildId: message.guild.id });

    if (logging) {
      if (logging.message_events.toggle == "true") {
        const channelEmbed = await message.guild.channels.cache.get(
          logging.message_events.channel
        );

        if (channelEmbed) {
          let color = logging.message_events.color;
          if (color == "#000000") color = this.client.color.red;

          if (logging.message_events.deleted == "true") {
            const embed = new MessageEmbed()
              .setAuthor({
                name: `Messages Cleared`,
                iconURL: message.guild.iconURL({ dynamic: true }),
              })
              .setTimestamp()
              .setDescription(
                `**${messages.size} messages** in ${message.channel} were deleted.`
              )
              .setColor(color)
              .setFooter({ text: `${messages.size} Messages` });

            if (
              channelEmbed &&
              channelEmbed.viewable &&
              channelEmbed
                .permissionsFor(message.guild.members.me)
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
