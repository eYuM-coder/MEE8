const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const Logging = require("../../database/schemas/logging.js");
const logger = require("../../utils/logger.js");
const send = require("../../packages/logs/index.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "clear",
      aliases: ["cls", "purge"],
      description: "Delete the specified amount of messages (limit: 10000)",
      category: "Moderation",
      usage: "purge <message-count> [reason]",
      examples: ["purge 20", "cls 50", "clear 125"],
      guildOnly: true,
      botPermission: ["MANAGE_MESSAGES"],
      userPermission: ["MANAGE_MESSAGES"],
    });
  }

  async run(message, args) {
    try {
      const logging = await Logging.findOne({ guildId: message.guild.id });

      const client = message.client;
      const fail = client.emoji.fail;
      const success = client.emoji.success;

      const channel = message.mentions.channels.first() || message.channel;

      if (message.mentions.channels.first()) {
        args.shift();
      }

      const amount = parseInt(args[0]);
      if (isNaN(amount) === true || !amount || amount < 0 || amount > 10000) {
        return message.channel.sendCustom({
          embeds: [
            new MessageEmbed()
              .setAuthor(
                `${message.author.tag}`,
                message.author.displayAvatarURL({ dynamic: true })
              )
              .setTitle(`${fail} Clear Error`)
              .setDescription(`I can only purge between 1 - 10000 messages.`)
              .setTimestamp()
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
              .setColor(message.guild.me.displayHexColor),
          ],
        });
      }

      let reason = args.slice(1).join(" ");
      if (!reason) {
        reason = "None";
      }
      if (reason.length > 1024) {
        reason = reason.slice(0, 1021) + "...";
      }

      let totalDeleted = 0;
      const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds
      const now = Date.now(); // Current timestamp

      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      while (totalDeleted < amount) {
        const messagesToFetch = Math.min(100, amount - totalDeleted);
        try {
          // Fetch messages
          const fetchedMessages = await channel.messages.fetch({
            limit: messagesToFetch,
            before: message.id,
          });

          // Filter out messages older than 14 days
          const validMessages = fetchedMessages.filter(
            (msg) => now - msg.createdTimestamp < TWO_WEEKS
          );

          if (validMessages.size === 0) break; // No eligible messages to delete

          // Bulk delete the valid messages
          const deletedMessages = await channel.bulkDelete(validMessages, true);

          totalDeleted += deletedMessages.size;

          logger.info(
            `Deleted ${deletedMessages.size} ${
              deletedMessages.size === 1 ? "message" : "messages"
            }.`,
            { label: "Purge" }
          );

          // If fewer than `messagesToFetch` were deleted, stop early
          if (deletedMessages.size < messagesToFetch) {
            break;
          } else if (deletedMessages.size !== 100 && deletedMessages.size == messagesToFetch) {
            break;
          }
        } catch (error) {
          logger.error(`Error deleting messages: ${error}`, { label: "ERROR" });
          return message.channel.send({
            content:
              "There was an error trying to delete messages in this channel.",
          });
        }
        await delay(5000);
      }

      if (channel == message.channel) {
      const embed = new MessageEmbed()

        .setDescription(
          `
            ${success} Successfully deleted **${totalDeleted}** ${
            totalDeleted === 1 ? "message" : "messages"
          } ${
            logging && logging.moderation.include_reason === "true"
              ? `\n\n**Reason:** ${reason}`
              : ``
          }
          `
        )

        .setColor(message.guild.me.displayHexColor);

      if (logging && logging.moderation.delete_after_executed === "true") {
        message.delete().catch(() => {});
      }

      message.channel
        .send({ embeds: [embed] })
        .then(async (s) => {
          if (logging && logging.moderation.delete_reply === "true") {
            setTimeout(() => {
              s.delete().catch(() => {});
            }, 5000);
          }
        })
        .catch(() => {});
      } else {
        const embed = new MessageEmbed()

        .setDescription(
          `
            ${success} Successfully deleted **${totalDeleted}** ${
            totalDeleted === 1 ? "message" : "messages"
          } from ${channel} ${
            logging && logging.moderation.include_reason === "true"
              ? `\n\n**Reason:** ${reason}`
              : ``
          }
          `
        )

        .setColor(message.guild.me.displayHexColor);

      if (logging && logging.moderation.delete_after_executed === "true") {
        message.delete().catch(() => {});
      }

      message.channel
        .send({ embeds: [embed] })
        .then(async (s) => {
          if (logging && logging.moderation.delete_reply === "true") {
            setTimeout(() => {
              s.delete().catch(() => {});
            }, 5000);
          }
        })
        .catch(() => {});
      }

      if (logging) {
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
                if (logging.moderation.purge == "true") {
                  let color = logging.moderation.color;
                  if (color == "#000000") color = message.client.color.red;

                  let logcase = logging.moderation.caseN;
                  if (!logcase) logcase = `1`;

                  const logEmbed = new MessageEmbed()
                    .setAuthor(
                      `Action: \`Purge\` | Case #${logcase}`,
                      message.author.displayAvatarURL({ format: "png" })
                    )
                    .addField("Moderator", `${message.member}`, true)
                    .setTimestamp()
                    .setFooter({ text: `Responsible ID: ${message.author.id}` })
                    .setColor(color);

                  send(channel, { username: `${this.client.user.username}`, embeds: [logEmbed] }).catch(() => {});

                  logging.moderation.caseN = logcase + 1;
                  await logging.save().catch(() => {});
                }
              }
            }
          }
        }
      }
    } catch (error) {
      logger.info(`An error occurred: ${error}`, { label: "ERROR" });
      return message.channel.sendCustom(
        `${message.client.emoji.fail} | Could not purge messages`
      );
    }
  }
};
