const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const Guild = require("../../database/schemas/Guild.js");
const Logging = require("../../database/schemas/logging.js");
const send = require("../../packages/logs/index.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "lock",
      aliases: ["lc"],
      description: "Locks the current / mentioned channel.",
      category: "Moderation",
      usage: "<channel> [time]",
      examples: ["lock #general"],
      guildOnly: true,
      botPermission: ["MANAGE_CHANNELS"],
      userPermission: ["MANAGE_CHANNELS"],
    });
  }

  async run(message, args) {
    const client = message.client;
    const fail = message.client.emoji.fail;
    const success = message.client.emoji.success;

    const logging = await Logging.findOne({ guildId: message.guild.id });
    const guildDB = await Guild.findOne({
      guildId: message.guild.id,
    });
    const language = require(`../../data/language/${guildDB.language}.json`);

    let channel = message.mentions.channels.first();
    let reason;

    if (channel) {
      reason = args.slice(1).join(" ").trim() || "`none`";
    } else {
      channel = message.channel;
      reason = args.join(" ").trim() || "`none`";
    }

    if (
      channel.permissionsFor(message.guild.id).has("SEND_MESSAGES") === false
    ) {
      const lockchannelError2 = new MessageEmbed()
        .setDescription(`${fail} | ${channel} is already locked`)
        .setColor(client.color.red);

      return message.channel.sendCustom(lockchannelError2);
    }

    channel.permissionOverwrites
      .edit(message.guild.me, { SEND_MESSAGES: true })
      .catch(() => {});

    channel.permissionOverwrites
      .edit(message.guild.id, { SEND_MESSAGES: false })
      .catch(() => {});

    channel.permissionOverwrites
      .edit(message.author.id, { SEND_MESSAGES: true })
      .catch(() => {});

    const embed = new MessageEmbed()
      .setDescription(
        `${success} | Successfully Locked **${channel}** ${
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
              if (logging.moderation.lock == "true") {
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
                    name: `Action: \`Lock\` | ${message.author.tag} | Case #${logcase}`,
                    iconURL: message.author.displayAvatarURL({ format: "png" }),
                  })
                  .addFields(
                    { name: "Channel", value: `${channel}`, inline: true },
                    {
                      name: "Moderator",
                      value: `${message.member}`,
                      inline: true,
                    },
                    { name: "Reason", value: `${reason}`, inline: true }
                  )
                  .setFooter({ text: `ID: ${message.author.id}` })
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
  }
};
