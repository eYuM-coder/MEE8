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
      name: "unblacklist",
      description: "Removes a user from the blacklist.",
      category: "Owner",
      usage: ["<user>"],
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
          message.guild.members.fetch(args[1])
        : null;
    } catch {
      return message.channel.sendCustom(`Provide me with a user`);
    }

    let guild = this.client.guilds.cache.get(args[1]);
    let reason = args.slice(2).join(" ") || "Not Specified";

    if (args.length < 1)
      return message.channel.sendCustom(
        `Please provide me with a user or guild blacklist`
      );
    if (args.length < 2)
      return message.channel.sendCustom(`Provide me with a user`);

    if (!member)
      return message.channel.sendCustom(`Provide me with a valid user`);
    //.then(logger.info(`I have added ${member.user.tag} to the blacklist!`, { label: 'Blacklist' }))

    if (args[0].includes("user")) {
      await Blacklist.findOne(
        {
          discordId: member.id,
        },
        (err, user) => {
          user.deleteOne();
        }
      );
      message.channel.sendCustom({
        embed: {
          color: "BLURPLE",
          title: "User removed from the blacklist!",
          description: `${member.user.tag} - \`${reason}\``,
        },
      });

      const embed = new MessageEmbed()
        .setColor("BLURPLE")
        .setTitle(`Blacklist Report`)
        .addFields(
          { name: "Status", value: "Removed from the blacklist." },
          { name: "User", value: `${member.user.tag} (${guild.id})` },
          {
            name: "Responsible",
            value: `${message.author} (${message.author.id})`,
          },
          { name: "Reason", value: reason }
        );

      webhookClient.sendCustom({
        username: "Neonova",
        avatarURL: "https://neonova.eyum.org/logo.png",
        embeds: [embed],
      });

      return;
    }

    if (args[0].includes("guild")) {
      await Blacklist.findOne(
        {
          guildId: guild.id,
        },
        (err, server) => {
          server.deleteOne();
        }
      );

      message.channel.sendCustom({
        embed: {
          color: "BLURPLE",
          title: "Server removed from the blacklist!",
          description: `${guild.name} - \`${reason}\``,
        },
      });

      const embed = new MessageEmbed()
        .setColor("BLURPLE")
        .setTitle(`Blacklist Report`)
        .addFields(
          { name: "Status", value: "Removed from the blacklist." },
          { name: "Server", value: `${guild.name} (${guild.id})` },
          {
            name: "Responsible",
            value: `${message.author} (${message.author.id})`,
          },
          { name: "Reason", value: reason }
        );

      webhookClient.sendCustom({
        username: "Neonova",
        avatarURL: "https://neonova.eyum.org/logo.png",
        embeds: [embed],
      });
    }
  }
};
