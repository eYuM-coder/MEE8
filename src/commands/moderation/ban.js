const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const Guild = require("../../database/schemas/Guild.js");
const Logging = require("../../database/schemas/logging.js");
const send = require("../../packages/logs/index.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "ban",
      aliases: ["b"],
      description: "Bans the specified user from your Discord server.",
      category: "Moderation",
      usage: "<user> [reason]",
      examples: ["ban @Peter Breaking the rules!"],
      guildOnly: true,
      botPermission: ["BAN_MEMBERS"],
      userPermission: ["BAN_MEMBERS"],
    });
  }

  async run(message, args) {
    const client = message.client;
    const logging = await Logging.findOne({ guildId: message.guild.id });
    const guildDB = await Guild.findOne({ guildId: message.guild.id });
    const language = require(`../../data/language/${guildDB.language}.json`);

    if (!args[0]) {
      return message.channel
        .send({
          embeds: [
            new MessageEmbed()
              .setDescription(`${client.emoji.fail} | ${language.banUserValid}`)
              .setColor(client.color.red),
          ],
        })
        .then(async (s) => {
          if (logging && logging.moderation.delete_reply === "true") {
            setTimeout(() => {
              s.delete().catch(() => {});
            }, 5000);
          }
        });
    }

    let member = message.guild.members.cache.get(args[0]);

    let user;
    if (!member) {
      try {
        user = await client.users.fetch(args[0]); // Fetch user if not found in the server
      } catch (err) {
        return message.channel
          .sendCustom({
            embeds: [
              new MessageEmbed()
                .setDescription(
                  `${client.emoji.fail} | ${language.banUserValid}`
                )
                .setColor(client.color.red),
            ],
          })
          .then(async (s) => {
            if (logging && logging.moderation.delete_reply === "true") {
              setTimeout(() => {
                s.delete().catch(() => {});
              }, 5000);
            }
          });
      }
    } else {
      user = member.user;
    }

    if (user.id === message.author.id)
      return message.channel
        .sendCustom({
          embeds: [
            new MessageEmbed()
              .setDescription(
                `${client.emoji.fail} | ${language.banYourselfError}`
              )
              .setColor(client.color.red),
          ],
        })
        .then(async (s) => {
          if (logging && logging.moderation.delete_reply === "true") {
            setTimeout(() => {
              s.delete().catch(() => {});
            }, 5000);
          }
        });

    let reason = args.slice(1).join(" ") || language.noReasonProvided;
    if (reason.length > 1024) reason = reason.slice(0, 1021) + "...";

    try {
      await message.guild.members.ban(user.id, {
        reason: `${reason} / Responsible user: ${message.author.tag}`,
      });

      const embed = new MessageEmbed()
        .setDescription(
          `${client.emoji.success} | **${user.tag}** ${language.banBan} ${
            logging && logging.moderation.include_reason === "true"
              ? `\n\n**Reason:** ${reason}`
              : ``
          }`
        )
        .setColor(client.color.green);

      message.channel.sendCustom({ embeds: [embed] }).then(async (s) => {
        if (logging && logging.moderation.delete_reply === "true") {
          setTimeout(() => {
            s.delete().catch(() => {});
          }, 5000);
        }
      });

      // Logging

      if (logging && logging.moderation.delete_after_executed === "true") {
        message.delete().catch(() => {});
      }
      if (logging && logging.moderation.ban === "true") {
        const logChannel = message.guild.channels.cache.get(
          logging.moderation.channel
        );
        if (logChannel) {
          let logcase = logging.moderation.caseN || 1;
          const logEmbed = new MessageEmbed()
            .setAuthor({
              name: `Action: \`Ban\` | ${user.tag} | Case #${logcase}`,
              iconURL: user.displayAvatarURL({ format: "png" }),
            })
            .addFields(
              { name: "User", value: `${user}`, inline: true },
              { name: "Moderator", value: `${message.member}`, inline: true },
              { name: "Reason", value: `${reason}`, inline: true }
            )
            .setFooter({ text: `ID: ${user.id}` })
            .setTimestamp()
            .setColor(logging.moderation.color || client.color.red);

          send(
            logChannel,
            {
              embeds: [logEmbed],
            },
            {
              name: `${client.user.username}`,
              username: `${client.user.username}`,
              iconURL: client.user.displayAvatarURL({
                dynamic: true,
                format: "png",
              }),
            }
          ).catch((e) => console.log(e));

          logging.moderation.caseN = logcase + 1;
          await logging.save().catch(() => {});
        }
      }
    } catch (error) {
      console.error(error);
      return message.channel.send({
        embeds: [
          new MessageEmbed()
            .setColor(client.color.red)
            .setDescription(`${client.emoji.fail} | I couldn't ban this user.`),
        ],
      });
    }
  }
};
