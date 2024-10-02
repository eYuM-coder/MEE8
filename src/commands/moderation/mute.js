const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const ms = require("ms");
const Logging = require("../../database/schemas/logging");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "mute",
      description: "",
      category: "Moderation",
      cooldown: 5,
    })
  }
  async run(message, args) {
    try {
      const client = message.client;
      const logging = await Logging.findOne({
        guildId: message.guild.id,
      });
      if (!message.member.permissions.has("MODERATE_MEMBERS"))
        return message.channel.send({
          content: "You do not have permission to use this command.",
        });

      const member = message.mentions.members.first();
      const reason = args.slice(2).join(" ") || "No reason provided";
      const time = ms(args[1]);

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

      if (
        member.roles.highest.position >=
        message.member.roles.highest.position
      ) {
        let rolesmatch = new MessageEmbed()
          .setColor("RED")
          .setDescription(
            `${client.emoji.fail} | They have more power than you or have equal power as you do!`,
          );
        return message.channel.sendCustom({ embeds: [rolesmatch] })
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
            `${client.emoji.fail} | The time specified is not valid. It is necessary that you provide valid time.`,
          );

        return message.channel.sendCustom({ embeds: [timevalid] }).then(async (s) => {
          if (logging && logging.moderation.delete_reply === "true") {
            setTimeout(() => {
              s.delete().catch(() => {});
            }, 5000);
          }
        });
      }
      if (member) {
        const response = await member.timeout(time, reason);
        let timeoutsuccess = new MessageEmbed()
          .setColor("GREEN")
          .setDescription(
            `***${client.emoji.success} | ${member} has been timed out for ${ms(
              time,
              { long: true },
            )}* || ${reason}**`,
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
      if (member) {
        let dmEmbed = new MessageEmbed()
          .setColor("RED")
          .setDescription(
            `You have been muted in **${
              interaction.guild.name
            }**.\n\n__**Moderator:**__ ${interaction.author} **(${
              interaction.author.tag
            })**\n__**Reason:**__ ${reason || "No Reason Provided"}`,
          )
          .setTimestamp();
        member.send({ embeds: [dmEmbed] });
      } else {
        let failembed = new MessageEmbed()
          .setColor(client.color.red)
          .setDescription(
            `${client.emoji.fail} | I cannot time out that member. Make sure that my role is above their role or that I have sufficient perms to execute the command.`,
          )
          .setTimestamp();
        return message.channel.sendCustom({ embeds: [failembed] });
      }
    } catch (err) {
      console.error(err);
      message.reply({
        content: "This command cannot be used in Direct Messages, or this member is not muteable.",
      });
    }
  }
};
