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
    const logging = await Logging.findOne({ guildId: message.guild.id });

    const client = message.client;

    const guildDB = await Guild.findOne({
      guildId: message.guild.id,
    });
    const language = require(`../../data/language/${guildDB.language}.json`);

    let member =
      message.mentions.members.last() ||
      message.guild.members.cache.get(args[0]);

    if (!member) {
      await client.users
        .fetch(args[0])
        .then(async (u) => {
          let reason = args.slice(1).join(" ");
          if (!reason) reason = `${language.noReasonProvided}`;
          if (reason.length > 1024) reason = reason.slice(0, 1021) + "...";

          await message.guild.members.ban(u.id, {
            reason: `${reason} / Responsible user: ${message.author.tag}`,
          });

          const embed = new MessageEmbed()
            .setDescription(
              `${client.emoji.success} | **${u.tag}** ${language.banBan} ${
                logging && logging.moderation.include_reason === "true"
                  ? `\n\n**Reason:** ${reason}`
                  : ``
              }`
            )
            .setColor(client.color.green);

          message.channel
            .sendCustom({ embeds: [embed] })
            .then(async (s) => {
              if (logging && logging.moderation.delete_reply === "true") {
                setTimeout(() => {
                  s.delete().catch(() => {});
                }, 5000);
              }
            })
            .catch(() => {});

          //LOGGING HERE
          if (logging) {
            if (logging.moderation.delete_after_executed === "true") {
              message.delete().catch(() => {});
            }

            const role = message.guild.roles.cache.get(
              logging.moderation.ignore_role
            );
            const channel = message.guild.channels.cache.get(
              logging.moderation.channel
            );

            if (logging.moderation.toggle == "true") {
              if (channel) {
                if (message.channel.id !== logging.moderation.ignore_channel) {
                  if (
                    !role ||
                    (role &&
                      !message.member.roles.cache.find(
                        (r) => r.name.toLowerCase() === role.name
                      ))
                  ) {
                    if (logging.moderation.ban == "true") {
                      let color = logging.moderation.color;
                      if (color == "#000000") color = message.client.color.red;

                      let logcase = logging.moderation.caseN;
                      if (!logcase) logcase = `1`;

                      let reason = args.slice(1).join(" ");
                      if (!reason) reason = `${language.noReasonProvided}`;
                      if (reason.length > 1024)
                        reason = reason.slice(0, 1021) + "...";

                      const logEmbed = new MessageEmbed()
                        .setAuthor({
                          name: `Action: \`Ban\` | ${u.tag} | Case #${logcase}`,
                          iconURL: u.displayAvatarURL({ format: "png" }),
                        })
                        .addField("User", u, true)
                        .addField("Moderator", `${message.member}`, true)
                        .addField("Reason", `${reason}`, true)
                        .setFooter({ text: `ID: ${u.id}` })
                        .setTimestamp()
                        .setColor(color);

                      send(channel, {
                        username: `${this.client.user.username}`,
                        embeds: [logEmbed],
                      }).catch((e) => {
                        console.log(e);
                      });

                      logging.moderation.caseN = logcase + 1;
                      await logging.save().catch(() => {});
                    }
                  }
                }
              }
            }
          }
        })
        .catch((err) => {
          console.log(err);
          return message.channel.sendCustom({
            embeds: [
              new MessageEmbed()
                .setDescription(
                  `${client.emoji.fail} | ${language.banUserValid}`
                )
                .setColor(client.color.red),
            ],
          });
        });
      return;
    }

    if (member.id === message.author.id)
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setDescription(
              `${client.emoji.fail} | ${language.banYourselfError}`
            )
            .setColor(client.color.red),
        ],
      });

    if (!member.bannable)
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setDescription(`${client.emoji.fail} | ${language.banBannable}`)
            .setColor(client.color.red),
        ],
      });

    let reason = args.slice(1).join(" ");
    if (!reason) reason = `${language.noReasonProvided}`;
    if (reason.length > 1024) reason = reason.slice(0, 1021) + "...";

    await member
      .ban({ reason: `${reason} / Responsible user: ${message.author.tag}` })
      .catch((err) =>
        message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setColor(message.client.color.red)
              .setDescription(
                `${message.client.emoji.fail} | This user is a mod/admin, I can't do that.`
              ),
          ],
        })
      );

    let dmEmbed;
    if (
      logging &&
      logging.moderation.ban_action &&
      logging.moderation.ban_message.toggle === "false" &&
      logging.moderation.ban_action !== "1"
    ) {
      if (logging.moderation.ban_action === "2") {
        dmEmbed = `${message.client.emoji.fail} You've been banned in **${message.guild.name}**`;
      } else if (logging.moderation.ban_action === "3") {
        dmEmbed = `${message.client.emoji.fail} You've been banned in **${message.guild.name}**\n\n__**Reason:**__ ${reason}`;
      } else if (logging.moderation.ban_action === "4") {
        dmEmbed = `${message.client.emoji.fail} You've been banned in **${message.guild.name}**\n\n__**Moderator:**__ ${message.author} **(${message.author.tag})**\n__**Reason:**__ ${reason}`;
      }

      member
        .send({
          embeds: [
            new MessageEmbed()
              .setColor(message.client.color.red)
              .setDescription(dmEmbed),
          ],
        })
        .catch(() => {});
    }

    if (
      logging &&
      logging.moderation.ban_message.toggle === "true" &&
      logging.moderation.ban_message.message
    ) {
      member
        .send(
          logging.moderation.ban_message.message
            .replace(/{user}/g, `${message.author}`)

            .replace(/{guildName}/g, `${message.guild.name}`)

            .replace(/{reason}/g, `${reason}`)

            .replace(/{userTag}/g, `${message.author.tag}`)

            .replace(/{userUsername}/g, `${message.author.username}`)

            .replace(/{userTag}/g, `${message.author.tag}`)

            .replace(/{userID}/g, `${message.author.id}`)

            .replace(/{guildID}/g, `${message.guild.id}`)

            .replace(/{guild}/g, `${message.guild.name}`)

            .replace(/{memberCount}/g, `${message.guild.memberCount}`)
        )
        .catch(() => {});
    }
    const embed = new MessageEmbed()
      .setDescription(
        `${client.emoji.success} | **${member.user.tag}** ${language.banBan} ${
          logging && logging.moderation.include_reason === "true"
            ? `\n\n**Reason:** ${reason}`
            : ``
        }`
      )
      .setColor(client.color.green);

    message.channel
      .sendCustom({ embeds: [embed] })
      .then(async (s) => {
        if (logging && logging.moderation.delete_reply === "true") {
          setTimeout(() => {
            s.delete().catch(() => {});
          }, 5000);
        }
      })
      .catch(() => {});

    // Update mod log
    if (logging) {
      if (logging.moderation.delete_after_executed === "true") {
        message.delete().catch(() => {});
      }

      const role = message.guild.roles.cache.get(
        logging.moderation.ignore_role
      );
      const channel = message.guild.channels.cache.get(
        logging.moderation.channel
      );

      if (logging.moderation.toggle == "true") {
        if (channel) {
          if (message.channel.id !== logging.moderation.ignore_channel) {
            if (
              !role ||
              (role &&
                !message.member.roles.cache.find(
                  (r) => r.name.toLowerCase() === role.name
                ))
            ) {
              if (logging.moderation.ban == "true") {
                let color = logging.moderation.color;
                if (color == "#000000") color = message.client.color.red;

                let logcase = logging.moderation.caseN;
                if (!logcase) logcase = `1`;

                const logEmbed = new MessageEmbed()
                  .setAuthor({
                    name: `Action: \`Ban\` | ${member.user.tag} | Case #${logcase}`,
                    iconURL: member.user.displayAvatarURL({ format: "png" }),
                  })
                  .addFields(
                    {
                      name: "User",
                      value: `${member}`,
                      inline: true,
                    },
                    {
                      name: "Moderator",
                      value: `${message.member}`,
                      inline: true,
                    },
                    { name: "Reason", value: `${reason}`, inline: true }
                  )
                  .setFooter({ text: `ID: ${member.id}` })
                  .setTimestamp()
                  .setColor(color);

                channel.send({ embeds: [logEmbed] }).catch((e) => {
                  console.log(e);
                });

                logging.moderation.caseN = logcase + 1;
                await logging.save().catch(() => {});
              }
            }
          }
        }
      }
    }
  }
};
