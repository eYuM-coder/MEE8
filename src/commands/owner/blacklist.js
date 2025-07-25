const Command = require("../../structures/Command");
const { WebhookClient, MessageEmbed } = require("discord.js");
const config = require("../../../config.json");
const webhookClient = new WebhookClient({
  url: config.webhooks.blacklist,
});
const Blacklist = require("../../database/schemas/blacklist");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "blacklist",
      aliases: ["bl"],
      description: "Adds a user to the blacklist.",
      category: "Owner",
      usage: ["<user> <reason>"],
    });
  }

  async run(message, args) {
    if (!message.client.config.owner.includes(message.author.id)) {
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor(message.client.color.red)
            .setDescription(
              `${message.client.emoji.fail} | You are not the owner of this bot.`
            ),
        ],
      });
    }

    const match = message.content.match(/\d{18}/);
    let member;
    try {
      member = match
        ? message.mentions.members.first() ||
          message.client.users.fetch(args[1])
        : null;
    } catch {
      return message.channel.sendCustom(`Provide me with a user`);
    }

    let guild = this.client.guilds.cache.get(args[1]);
    let reason = args.slice(2).join(" ") || "Not Specified";

    if (args.length < 1)
      return message.channel.sendCustom(
        `Please provide me with a user or guild blacklist [{prefix} blacklist <user | guild> <actual user or guild>. Example: {prefix} blacklist user @user]`
      );
    if (args.length < 2)
      return message.channel.sendCustom(`Provide me with a user`);

    if (!member)
      return message.channel.sendCustom(`Provide me with a valid user`);

    if (args[0] === "user") {
      await Blacklist.findOne(
        {
          discordId: member.id,
        },
        (err, user) => {
          if (!user) {
            const blacklist = new Blacklist({
              discordId: member.id,
              length: null,
              type: "user",
              isBlacklisted: true,
              reason,
            });
            blacklist.save();
          } else {
            user.updateOne({
              type: "user",
              isBlacklisted: true,
              reason,
              length: null,
            });
          }
        }
      );

      message.channel.sendCustom({
        embed: {
          color: "BLURPLE",
          title: `User added to the blacklist! `,
          description: `${member.user.tag} - \`${reason}\``,
        },
      });

      const embed = new MessageEmbed()
        .setColor("BLURPLE")
        .setTitle(`Blacklist Report`)
        .addFields(
          { name: "Status", value: "Added to the blacklist." },
          { name: "User", value: `${member.user.tag} (${member.id})` },
          {
            name: "Responsible",
            value: `${message.author} (${message.author.id})`,
          },
          { name: "Reason", value: `${reason}` }
        );

      return webhookClient.sendCustom({
        username: "Neonova",
        avatarURL: `https://neonova.eyum.org/logo.png`,
        embeds: [embed],
      });
    }

    // guild blacklist
    if (args[0] === "guild") {
      await Blacklist.findOne(
        {
          guildId: guild,
        },
        (err, server) => {
          if (!server) {
            const blacklist = new Blacklist({
              guildId: guild.id,
              length: null,
              type: "guild",
              isBlacklisted: true,
              reason,
            });
            blacklist.save();
          } else {
            server.updateOne({
              type: "guild",
              isBlacklisted: true,
              reason,
              length: null,
            });
          }
        }
      );

      message.channel.sendCustom({
        embed: {
          color: "BLURPLE",
          title: "Server added to the blacklist!",
          description: `${guild.name} - \`${reason}\``,
        },
      });

      const embed = new MessageEmbed()
        .setColor("BLURPLE")
        .setTitle(`Blacklist Report`)
        .addFields(
          { name: "Status", value: "Added to the blacklist." },
          { name: "Server", value: `${guild.name} (${guild.id})` },
          {
            name: "Responsible",
            value: `${message.author} (${message.author.id})`,
          },
          { name: "Reason", value: reason }
        );

      return webhookClient.sendCustom({
        username: `${config.botName} Blacklists`,
        avatarURL: `https://neonova.eyum.org/logo.png`,
        embeds: [embed],
      });
    }
  }
};
