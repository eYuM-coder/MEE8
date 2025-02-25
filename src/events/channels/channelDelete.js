const Event = require("../../structures/Event");
const Logging = require("../../database/schemas/logging");
const discord = require("discord.js");
const send = require("../../packages/logs/index.js");

const Maintenance = require("../../database/schemas/maintenance");
module.exports = class extends Event {
  async run(message) {
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") return;

    const logging = await Logging.findOne({ guildId: message.guild.id });

    if (logging) {
      if (logging.server_events.toggle == "true") {
        if (message.name.indexOf("Room") >= 0) return;

        const channelEmbed = await message.guild.channels.cache.get(
          logging.server_events.channel
        );

        if (channelEmbed) {
          let color = logging.server_events.color;
          if (color == "#000000") color = message.client.color.red;

          if (logging.server_events.channel_delete == "true") {
            const embed = new discord.MessageEmbed()
              .setDescription(`:wastebasket: ***Channel Deleted***`)
              .addFields({name:"Channel Type", value:`${message.type}`, inline:true},{name:"Channel Name", value:`${message.name}`, inline:true})
              .setFooter({ text: `Channel ID: ${message.id}` })
              .setTimestamp()
              .setColor(color);

            if (
              channelEmbed &&
              channelEmbed.viewable &&
              channelEmbed
                .permissionsFor(message.guild.me)
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
