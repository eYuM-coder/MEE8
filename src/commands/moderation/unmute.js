const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const Logging = require("../../database/schemas/logging");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "unmute",
      description: "",
      category: "Moderation",
      cooldown: 5,
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

      // Check for permissions
      if (!message.member.permissions.has("MODERATE_MEMBERS")) {
        return message.channel.send({
          content: "You do not have permission to use this command.",
        });
      }

      const member = message.mentions.members.first();
      let reason = args.slice(1).join(" ").trim();
      reason = reason || "Not Specified";

      if (!member) {
        let usernotfound = new MessageEmbed()
          .setColor("RED")
          .setDescription(`${client.emoji.fail} | I can't find that member`);
        return message.channel
          .send({ embeds: [usernotfound] })
          .then(async (s) => {
            if (logging && logging.moderation.delete_reply === "true") {
              setTimeout(() => {
                s.delete().catch(() => {});
              }, 5000);
            }
          })
          .catch(() => {});
      }

      if (member) {
        const response = await member.timeout(null, reason);
        let unmuteSuccess = new MessageEmbed()
          .setColor("GREEN")
          .setDescription(
            `***${client.emoji.success} | ${member} has been unmuted.* || ${reason}**`
          );
        return message.channel
          .send({ embeds: [unmuteSuccess] })
          .then(async (s) => {
            if (logging && logging.moderation.delete_reply === "true") {
              setTimeout(() => {
                s.delete().catch(() => {});
              }, 5000);
            }
          })
          .catch(() => {});
      }

      if (member) {
        let dmEmbed = new MessageEmbed()
          .setColor("GREEN")
          .setDescription(
            `You have been unmuted in **${
              message.guild.name
            }**.\n\n__**Moderator:**__ ${message.author} **(${
              message.author.tag
            })**\n__**Reason:**__ ${reason || "No Reason Provided"}`
          )
          .setTimestamp();
        member.send({ embeds: [dmEmbed] });
      } else {
        let failembed = new MessageEmbed()
          .setColor("RED")
          .setDescription(
            `${client.emoji.fail} | That person is a mod/admin, I can't do that.`
          )
          .setTimestamp();
        return message.channel.send({ embeds: [failembed] });
      }
    } catch (err) {
      console.error(err);
      message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
          .setColor(message.client.color.red)
          .setDescription(`${message.client.emoji.fail} | This user is a mod/admin, I can't do that.`)
        ]
      });
    }
  }
};
