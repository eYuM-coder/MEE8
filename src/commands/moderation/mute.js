const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const ms = require("ms");
const Logging = require("../../database/schemas/logging");
async function usePrettyMs(ms) {
  const { default: prettyMilliseconds } = await import("pretty-ms");
  const time = prettyMilliseconds(ms);
  return time;
}

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "mute",
      description: "",
      category: "Moderation",
      cooldown: 5,
      userPermission: ["MODERATE_MEMBERS"],
      botPermission: ["MODERATE_MEMBERS"],
    });
  }
  async run(message, args) {
    try {
      const client = message.client;
      const logging = await Logging.findOne({
        guildId: message.guild.id,
      });

      if (logging && logging.moderation.delete_after_executed === "true") {
        await message.delete().catch(() => {});
      }

      if (!message.member.permissions.has("MODERATE_MEMBERS"))
        return message.channel.send({
          content: "You do not have permission to use this command.",
        });

      const member = message.mentions.members.first();
      const allArgs = args.slice(1).join(" ");

      // Regular expression to detect valid time formats (like "2w", "6d", "1h", "30m", etc.)
      const timeRegex = /\d+\s*[a-z]+/g;

      // Extract all potential time parts from the combined string
      const timeMatches = allArgs.match(timeRegex).join(" ");

      // If there are time parts, parse them; otherwise, default to "6h"
      let time = timeMatches ? ms(timeMatches) : ms("6h");
      let formattedTime = await usePrettyMs(time);

      // Remove the parsed time from the reason
      let reason = allArgs.replace(timeMatches ? timeMatches : "", "").trim();
      reason = reason || "Not Specified"; // Default reason if none provided

      if (!member) {
        let usernotfound = new MessageEmbed()
          .setColor("RED")
          .setDescription(`${client.emoji.fail} | I can't find that member`);
        return message.channel
          .sendCustom({ embeds: [usernotfound] })
          .then(async (s) => {
            if (logging && logging.moderation.delete_reply === "true") {
              setTimeout(() => {
                s.delete().catch(() => {});
              }, 5000);
            }
          })
          .catch(() => {});
      }

      if (!time) {
        let timevalid = new MessageEmbed()
          .setColor("RED")
          .setDescription(
            `${client.emoji.fail} | The time specified is not valid. It is necessary that you provide valid time.`
          );

        return message.channel
          .sendCustom({ embeds: [timevalid] })
          .then(async (s) => {
            if (logging && logging.moderation.delete_reply === "true") {
              setTimeout(() => {
                s.delete().catch(() => {});
              }, 5000);
            }
          });
      }

      const response = await member.timeout(time, reason);

      if (response) {
        let timeoutsuccess = new MessageEmbed()
          .setColor("GREEN")
          .setDescription(
            `***${client.emoji.success} | ${member} has been timed out for ${formattedTime}* || ${reason}**`
          );
        return message.channel
          .sendCustom({ embeds: [timeoutsuccess] })
          .then(async (s) => {
            if (logging && logging.moderation.delete_reply === "true") {
              setTimeout(() => {
                s.delete().catch(() => {});
              }, 5000);
            }
          })
          .catch(() => {});
      }

      if (response) {
        let dmEmbed = new MessageEmbed()
          .setColor("RED")
          .setDescription(
            `You have been muted in **${
              message.guild.name
            }**.\n\n__**Moderator:**__ ${message.author} **(${
              message.author.tag
            })**\n__**Reason:**__ ${reason || "No Reason Provided"}`
          )
          .setTimestamp();
        member.send({ embeds: [dmEmbed] });
      } else {
        let failembed = new MessageEmbed()
          .setColor(client.color.red)
          .setDescription(
            `${client.emoji.fail} | This user is a mod/admin, I can't do that.`
          )
          .setTimestamp();
        return message.channel.sendCustom({ embeds: [failembed] });
      }
    } catch (err) {
      console.error(err);
      message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor(message.client.color.red)
            .setDescription(
              `${message.client.emoji.fail} | This user is a mod/admin, I can't do that.`
            ),
        ],
      });
    }
  }
};
