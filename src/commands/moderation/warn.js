const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const Guild = require("../../database/schemas/Guild.js");
const warnModel = require("../../database/models/moderation.js");
const discord = require("discord.js");
const randoStrings = require("../../packages/randostrings.js");
const random = new randoStrings();
const Logging = require("../../database/schemas/logging.js");
const ms = require("ms");
const send = require("../../packages/logs/index.js");
async function usePrettyMs(ms) {
  const { default: prettyMilliseconds } = await import("pretty-ms");
  const time = prettyMilliseconds(ms);
  return time;
}
module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "warn",
      aliases: ["w"],
      description:
        "Gives a warning to the specified user from your Discord server.",
      category: "Moderation",
      usage: "<user> [time] [reason]",
      examples: ["warn @user Please do not swear."],
      guildOnly: true,
      userPermission: ["KICK_MEMBERS"],
    });
  }

  async run(message, args) {
    const client = message.client;

    const logging = await Logging.findOne({ guildId: message.guild.id });
    const guildDB = await Guild.findOne({
      guildId: message.guild.id,
    });
    let language = require(`../../data/language/${guildDB.language}.json`);

    const mentionedMember =
      message.mentions.members.last() ||
      message.guild.members.cache.get(args[0]);

    if (!mentionedMember) {
      return message.channel.sendCustom({
        embeds: [
          new discord.MessageEmbed()
            .setDescription(
              `${client.emoji.fail} | ${language.warnMissingUser}`
            )
            .setTimestamp(message.createdAt)
            .setColor(client.color.red),
        ],
      });
    }

    // Combine all arguments after the mention into one string
    const fullCommand = args.slice(1).join(" ");
    const input = fullCommand;
    const regex = /"([^"]+)"|(\d+\s*[a-z]+)|(\S+)/g;

    let match;
    const parts = [];

    while ((match = regex.exec(input)) !== null) {
      // match[1] is for quoted strings
      // match[2] is for time durations (e.g., "2d", "6h")
      // match[3] is for any other non-whitespace part
      if (match[1]) {
        parts.push({ type: 'quoted', value: match[1] });
      } else if (match[2]) {
        parts.push({ type: 'time', value: match[2] });
      } else if (match[3]) {
        parts.push({ type: 'other', value: match[3] });
      }
    }

    console.log(parts);


    let parsedArgs = null;
    try {
      parsedArgs = parts.map((arg) => arg.replace(/^"|"$/g, ""));
    } catch (e) {
      // do nothing
    }
    let time = 0;
    try {
      time = ms(parsedArgs[0])
    } catch (e) {
      time = ms("1d");
    }

    // If there are time parts, parse them; otherwise, set time to null (infinite)
    let formattedTime = time ? await usePrettyMs(time) : "Infinity";

    // Remove the parsed time from the reason
    let reason = parsedArgs !== undefined ? args.slice(match !== undefined ? 1 : 0).join(" ") : parsedArgs.slices(match !== undefined ? 1 : 0).join(" ");

    reason = reason || "Not Specified"; // Default reason if none provided

    let warnID = random.password({
      length: 16,
      string: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
    });

    // Set expiration time only if a duration is provided
    const expirationTime = time
      ? new Date(Date.now() + time)
      : null;

    let warnDoc = await warnModel
      .findOne({
        guildID: message.guild.id,
        memberID: mentionedMember.id,
      })
      .catch((err) => console.log(err));

    if (!warnDoc) {
      warnDoc = new warnModel({
        guildID: message.guild.id,
        memberID: mentionedMember.id,
        modAction: [],
        warnings: [],
        warningID: [],
        moderator: [],
        date: [],
        expiresAt: [],
      });

      await warnDoc.save().catch((err) => console.log(err));

      warnDoc = await warnModel.findOne({
        guildID: message.guild.id,
        memberID: mentionedMember.id,
      });
    }

    warnDoc.modType.push("warn");
    warnDoc.warnings.push(reason);
    warnDoc.warningID.push(warnID);
    warnDoc.moderator.push(message.member.id);
    warnDoc.date.push(Date.now());

    // Only add expiration time if it's not infinite
    if (expirationTime) {
      warnDoc.expiresAt.push(expirationTime);
    } else {
      warnDoc.expiresAt.push(null); // Represent infinite expiration
    }

    await warnDoc.save().catch((err) => console.log(err));

    let dmEmbed;
    if (
      logging &&
      logging.moderation.warn_action &&
      logging.moderation.warn_action !== "1"
    ) {
      if (logging.moderation.warn_action === "2") {
        dmEmbed = `${message.client.emoji.fail} | You were warned in **${message.guild.name
          }**.\n\n**Expires** <t:${Math.floor(
            expirationTime.getTime() / 1000
          )}:F>`;
      } else if (logging.moderation.warn_action === "3") {
        dmEmbed = `${message.client.emoji.fail} | You were warned in **${message.guild.name
          }** for ${reason}.\n\n**Duration:** ${formattedTime}`;
      } else if (logging.moderation.warn_action === "4") {
        dmEmbed = `${message.client.emoji.fail} | You were warned in **${message.guild.name
          }** by **${message.author} (${message.author.tag
          })** for ${reason}.\n\n**Duration:** ${formattedTime}`;
      }

      mentionedMember
        .send({
          embeds: [
            new MessageEmbed()
              .setColor(message.client.color.red)
              .setDescription(dmEmbed),
          ],
        })
        .catch(() => { });
    }
    message.channel
      .sendCustom({
        embeds: [
          new discord.MessageEmbed().setColor(client.color.green)
            .setDescription(`${language.warnSuccessful

              .replace("{emoji}", client.emoji.success)
              .replace("{user}", `**${mentionedMember.user.tag}** `)}
      ${logging && logging.moderation.include_reason === "true"
                ? `\n\n**Reason:** ${reason}`
                : ``
              }\n\n**Duration: ${formattedTime}**`),
        ],
      })
      .then(async (s) => {
        if (logging && logging.moderation.delete_reply === "true") {
          setTimeout(() => {
            s.delete().catch(() => { });
          }, 5000);
        }
      })
      .catch(() => { });

    if (logging && logging.moderation.auto_punish.toggle === "true") {
      if (
        Number(logging.moderation.auto_punish.amount) <=
        Number(warnDoc.warnings.length)
      ) {
        const punishment = logging.moderation.auto_punish.punishment;
        let action;

        if (punishment === "1") {
          action = `banned`;

          await mentionedMember
            .ban({
              reason: `Auto Punish / Responsible user: ${message.author.tag}`,
            })
            .catch(() => { });
        } else if (punishment === "2") {
          action = `kicked`;

          await mentionedMember
            .kick({
              reason: `Auto Punish / Responsible user: ${message.author.tag}`,
            })
            .catch(() => { });
        } else if (punishment === "3") {
          action = `softbanned`;

          await mentionedMember.ban({
            reason: `Auto Punish / ${language.softbanResponsible}: ${message.author.tag}`,
            days: 7,
          });
          await message.guild.members.unban(
            mentionedMember.user,
            `Auto Punish / ${language.softbanResponsible}: ${message.author.tag}`
          );
        }

        message.channel.sendCustom({
          embeds: [
            new discord.MessageEmbed()
              .setColor(message.client.color.green)
              .setDescription(
                `Auto Punish triggered, ${action} **${mentionedMember.user.tag}** ${message.client.emoji.success}`
              ),
          ],
        });

        const auto = logging.moderation.auto_punish;
        if (auto.dm && auto.dm !== "1") {
          let dmEmbed;
          if (auto.dm === "2") {
            dmEmbed = `${message.client.emoji.fail} You've been ${action} from **${message.guild.name}**\n__(Auto Punish Triggered)__`;
          } else if (auto.dm === "3") {
            dmEmbed = `${message.client.emoji.fail} You've been ${action} from **${message.guild.name}**\n__(Auto Punish Triggered)__\n\n**Warn Count:** ${warnDoc.warnings.length}`;
          }

          mentionedMember.send({
            embeds: [
              new MessageEmbed()
                .setColor(message.client.color.red)
                .setDescription(dmEmbed),
            ],
          });
        }
      }
    }
    if (logging) {
      if (logging.moderation.delete_after_executed === "true") {
        message.delete().catch(() => { });
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
              if (logging.moderation.warns == "true") {
                let color = logging.moderation.color;
                if (color == "#000000") color = message.client.color.red;

                let logcase = logging.moderation.caseN;
                if (!logcase) logcase = `1`;

                const logEmbed = new MessageEmbed()
                  .setAuthor(
                    `Action: \`Warn\` | ${mentionedMember.user.tag} | Case #${logcase}`,
                    mentionedMember.user.displayAvatarURL({ format: "png" })
                  )
                  .addField("User", `${mentionedMember}`, true)
                  .addField("Moderator", `${message.member}`, true)
                  .addField("Reason", `${reason}`, true)
                  .setFooter({
                    text: `ID: ${mentionedMember.id} | Warn ID: ${warnID}`,
                  })
                  .setTimestamp()
                  .setColor(color);

                send(channel, { username: `${this.client.user.username}`, embeds: [logEmbed] }).catch((e) => {
                  console.log(e);
                });

                logging.moderation.caseN = logcase + 1;
                await logging.save().catch(() => { });
              }
            }
          }
        }
      }
    }
  }
};
