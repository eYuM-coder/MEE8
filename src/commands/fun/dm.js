const { Command } = require("../../structures/Command");
const Logging = require("../../database/schemas/logging");
const { MessageEmbed } = require("discord.js");
const dmSystem = require("../../database/models/dmSystem");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "dm",
      description: "DMs a user",
      category: "Fun",
      usage: "<user> <message>",
      examples: ["dm @Peter hi"],
      cooldown: 5
    });
  }
  async run(message, args) {
    try {
      const client = message.client;
      const logging = await Logging.findOne({ guildId: message.guild.id });

      const member = message.mentions.members.first();
      const _message = args.slice(1).join(" ");

      const dmProfile = await dmSystem.findOne({ userId: member.id });
      if (!dmProfile) {
        const newDmSystem = new dmSystem({ userId: member.id, optedout: "false" });

        await newDmSystem.save();

        const dmoptin = new MessageEmbed()
          .setDescription(`User was not registered in DM system, use the command again.`);
        return message.channel.sendCustom({
          embeds: [dmoptin]
        }).then(async () => {
          if (logging && logging.moderation.delete_reply === "true") {
            setTimeout(async (s) => {
              await s.delete().catch(() => { });
            }, 5000);
          }
        })
          .catch(() => { });
      } else if (!member) {
        const embed = new MessageEmbed()
          .setDescription(`${client.emoji.fail} | Please mention a valid user!`)
          .setColor(client.color.red)
        return message.channel.sendCustom({
          embeds: [embed]
        }).then(async (s) => {
          if (logging && logging.moderation.delete_reply === "true") {
            setTimeout(async () => {
              await s.delete().catch(() => { });
            }, 5000)
          }
        })
          .catch(() => { })
      }

      if (member.id === message.author.id) {
        if (dmProfile.optedout === "false") {
          const embed = new MessageEmbed()
            .setDescription(`${client.emoji.success} | That was kind of... Ok..? But why would you dm yourself?`)
            .setColor(client.color.green);
          message.channel.sendCustom({ embeds: [embed] })
            .then(async (s) => {
              if (logging && logging.moderation.delete_reply === "true") {
                setTimeout(async () => {
                  await s.delete().catch(() => { });
                }, 5000)
              }
            })
            .catch(() => { });
          const dmEmbed = new MessageEmbed()
            .setTitle(`Why are you DMing yourself?`)
            .setDescription(`${_message}`)
            .setColor("RANDOM")
          member.send({ embeds: [embed] });
        } else {
          const embed = new MessageEmbed()
            .setDescription(`You have opted out of the DM system! Use /dmoptin to begin recieving DMs.`)
            .setColor(client.color.red)
          message.channel.sendCustom({ embeds: [embed] })
            .then(async (s) => {
              if (logging && logging.moderation.delete_reply === "true") {
                setTimeout(async () => {
                  await s.delete().catch(() => { });
                }, 5000);
              }
            })
            .catch(() => { });
        }
      } else {
        if (dmProfile.optedout === "false") {
          const embed = new MessageEmbed()
            .setDescription(`${client.emoji.success} | I have successfully sent the message to ${member}!`)
            .setColor(client.color.green)
          message.channel.sendCustom({ embeds: [embed] })
            .then(async (s) => {
              if (logging && logging.moderation.delete_reply === "true") {
                setTimeout(async () => {
                  await s.delete().catch(() => { });
                }, 5000)
              }
            }).catch(() => { });
          const dmEmbed = new MessageEmbed()
            .setTitle(`New Message from ${message.author}`)
            .setDescription(`${message}`)
            .setColor("RANDOM")
          member.send({ embeds: [dmEmbed] })
        } else {
          const embed = new MessageEmbed()
            .setDescription(`This user has opted out of the DM system. They are unable to recieve DMs unless they use the /dmoptin command.`)
            .setColor(client.color.red)
          message.channel.sendCustom({ embed: [embed] })
            .then(async (s) => {
              if (logging && logging.moderation.delete_reply === "true") {
                setTimeout(async () => {
                  await s.delete().catch(() => { });
                }, 5000)
              }
            }).catch(() => { });
        }
      }
    } catch (error) {
      return message.channel.send({ content: "An error occurred." });
    }
  }
}