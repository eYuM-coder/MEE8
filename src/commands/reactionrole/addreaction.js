const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const ReactionRole = require("../../packages/reactionrole/index.js");
const react = new ReactionRole();
require("dotenv").config();
react.setURL(process.env.MONGO);

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "addreaction",
      aliases: [
        "reactionrole",
        "rr",
        "createrr",
        "crr",
        "addrr",
        "arr",
        "rradd",
      ],
      description: "Create a reaction role",
      category: "Reaction Role",
      cooldown: 3,
      usage: "[channel] <messageID> <role> <emoji> (option)",
      userPermission: ["MANAGE_GUILD"],
    });
  }

  async run(message, args) {
    let client = message.client;
    let fail = message.client.emoji.fail;

    let channel = message.mentions.channels.first() || message.channel;
    if (!channel)
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setAuthor({
              name: message.author.tag,
              iconURLL: message.author.displayAvatarURL(),
            })
            .setDescription(`${fail} Provide me with a valid Channel`)
            .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
            .setColor(client.color.red),
        ],
      });

    let ID = args[1];
    if (!ID)
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setAuthor({
              name: message.author.tag,
              iconURLL: message.author.displayAvatarURL(),
            })
            .setDescription(`${fail} Provide me with a valid message ID`)
            .setFooter({ text: `${process.env.AUTH_DOMAIN}` }),
        ],
      });
    let messageID = await channel.messages.fetch(ID).catch(() => {
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setAuthor({
              name: message.author.tag,
              iconURLL: message.author.displayAvatarURL(),
            })
            .setDescription(`${fail} I could not find the following ID`)
            .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
            .setColor(client.color.red),
        ],
      });
    });

    let role =
      message.mentions.roles.first() ||
      message.guild.roles.cache.get(args[2]) ||
      message.guild.roles.cache.find((rl) => rl.name === args[2]);
    if (!role)
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setAuthor({
              name: message.author.tag,
              iconURLL: message.author.displayAvatarURL(),
            })
            .setDescription(`${fail} Provide me with a valid Role`)
            .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
            .setColor(client.color.red),
        ],
      });

    if (role.managed) {
      return message.channel.sendCustom(
        `${message.client.emoji.fail} Please do not use a integration role.`
      );
    }

    let emoji = args[3];

    if (!emoji)
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setAuthor({
              name: message.author.tag,
              iconURLL: message.author.displayAvatarURL(),
            })
            .setDescription(`${fail} Provide me with a valid Emoji`)
            .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
            .setColor(client.color.red),
        ],
      });

    try {
      await messageID.react(emoji);
    } catch (err) {
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setAuthor({
              name: message.author.tag,
              iconURLL: message.author.displayAvatarURL(),
            })
            .setDescription(`${fail} Please Provide a valid Emoji.`)
            .setColor(client.color.red)
            .setFooter({ text: `${process.env.AUTH_DOMAIN}` }),
        ],
      });
    }

    let option = args[4];
    if (!option) option = 1;
    if (isNaN(option)) option = 1;
    if (option > 6) option = 1;

    await react.reactionCreate(
      client,
      message.guild.id,
      ID,
      role.id,
      emoji,
      "false",
      option
    );

    message.channel.sendCustom({
      embeds: [
        new MessageEmbed()
          .setAuthor({
            name: "Reaction Roles",
            iconURL: message.guild.iconURL(),
            url: messageID.url,
          })
          .setColor(client.color.green)
          .addFields(
            { name: "Channel", value: `${channel}`, inline: true },
            { name: "Emoji", value: `${emoji}`, inline: true },
            { name: "Type", value: `${option}`, inline: true },
            { name: "Message ID", value: `${ID}`, inline: true },
            {
              name: "Message",
              value: `[Jump To Message](${messageID.url})`,
              inline: true,
            },
            { name: "Role", value: `${role}`, inline: true }
          )
          .setFooter({ text: `${process.env.AUTH_DOMAIN}` }),
      ],
    });
  }
};
