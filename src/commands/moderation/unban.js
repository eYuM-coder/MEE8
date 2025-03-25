const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const Guild = require("../../database/schemas/Guild.js");
const send = require("../../packages/logs/index.js");
const Logging = require("../../database/schemas/logging.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "unban",
      aliases: ["ub", "uban"],
      description: "Unban the specified user from the guild",
      category: "Moderation",
      usage: "<user-ID>",
      examples: ["unban 710465231779790849"],
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

    const id = args[0];
    if (!id) {
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setAuthor({
              name: message.author.tag,
              iconURL: message.author.displayAvatarURL(),
            })
            .setDescription(
              `**Proper Usage:**\n\n\`1-\` unban peter_#4444 appealed\n\`2-\` unban 710465231779790849 appealed\n\`3-\` unban all`
            )
            .setColor(client.color.red)
            .setFooter({ text: `${process.env.AUTH_DOMAIN}` }),
        ],
      });
    }

    const bannedUsers = await message.guild.bans.fetch();
    if (id.toLowerCase() === "all") {
      if (bannedUsers.size === 0) {
        return message.channel
          .sendCustom({
            embeds: [
              new MessageEmbed()
                .setDescription(`${client.emoji.fail} | No banned users found.`)
                .setColor(client.color.green),
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

      const unbannedUsers = [];
      for (const [userID, banInfo] of bannedUsers) {
        await message.guild.members.unban(
          userID,
          `Unban All - ${message.author.tag}`
        );
        unbannedUsers.push(banInfo.user.tag);
      }

      const embed = new MessageEmbed()
        .setDescription(
          `${client.emoji.success} | Unbanned **${unbannedUsers.length}** users from the guild.`
        )
        .setColor(client.color.green);
      message.channel.sendCustom({ embeds: [embed] }).then(async (s) => {
        if (logging && logging.moderation.delete_reply === "true") {
          setTimeout(() => {
            s.delete().catch(() => {});
          }, 5000);
        }
      });

      if (logging && logging.moderation.delete_after_executed === "true") {
        message.delete().catch(() => {});
      }
      if (logging?.moderation?.toggle === "true") {
        const logChannel = message.guild.channels.cache.get(
          logging.moderation.channel
        );
        if (logChannel) {
          const logEmbed = new MessageEmbed()
            .setAuthor({
              name: `Action: Unban All | ${unbannedUsers.length} users`,
              iconURL: message.author.displayAvatarURL(),
            })
            .setDescription(`Moderator: ${message.member}`)
            .setColor(logging.moderation.color || client.color.yellow)
            .setTimestamp();
          send(
            logChannel,
            { embeds: [logEmbed] },
            {
              name: `${client.user.username}`,
              username: `${client.user.username}`,
              icon: client.user.displayAvatarURL({
                dynamic: true,
                format: "png",
              }),
            }
          );
        }
      }
      return;
    }

    const user = bannedUsers.get(id);
    if (!user) {
      return message.channel
        .sendCustom({
          embeds: [
            new MessageEmbed()
              .setDescription(
                `${client.emoji.fail} | User not found in ban list.`
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

    let reason = args.slice(1).join(" ") || language.unbanNoReason;
    if (reason.length > 1024) reason = reason.slice(0, 1021) + "...";

    await message.guild.members.unban(
      user.user,
      `${reason} - ${message.author.tag}`
    );

    message.channel
      .sendCustom({
        embeds: [
          new MessageEmbed()
            .setDescription(
              `${client.emoji.success} | Unbanned **${user.user.tag}**${
                logging?.moderation?.include_reason === "true"
                  ? `\n\n**Reason:** ${reason}`
                  : ""
              }`
            )
            .setColor(client.color.green),
        ],
      })
      .then(async (s) => {
        if (logging && logging.moderation.delete_reply === "true") {
          setTimeout(() => {
            s.delete().catch(() => {});
          }, 5000);
        }
      });

    if (logging && logging.moderation.delete_reply === "true") {
      message.delete().catch(() => {});
    }

    if (logging?.moderation?.toggle === "true") {
      const logChannel = message.guild.channels.cache.get(
        logging.moderation.channel
      );
      if (logChannel) {
        const logEmbed = new MessageEmbed()
          .setAuthor({
            name: `Action: Unban | ${user.user.tag}`,
            iconURL: user.user.displayAvatarURL(),
          })
          .addFields(
            { name: "User", value: `${user.user}`, inline: true },
            { name: "Moderator", value: `${message.member}`, inline: true },
            { name: "Reason", value: reason, inline: false }
          )
          .setFooter({ text: `ID: ${user.user.id}` })
          .setTimestamp()
          .setColor(logging.moderation.color || client.color.yellow);
        send(
          logChannel,
          { embeds: [logEmbed] },
          {
            name: `${client.user.username}`,
            username: `${client.user.username}`,
            icon: client.user.displayAvatarURL({
              dynamic: true,
              format: "png",
            }),
          }
        );
      }
    }
  }
};
