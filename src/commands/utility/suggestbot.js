const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const discord = require("discord.js");
const crypto = require("crypto");
const config = require("../../../config.json");
const webhookClient = new discord.WebhookClient({
  url: config.webhooks.suggestions,
});
const Guild = require("../../database/schemas/Guild");
module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "suggestbot",
      aliases: ["botsuggest"],
      description: `Suggest a new feature for Neonova!`,
      category: "Utility",
      examples: ["suggest Can you add music Please!"],
      cooldown: 60,
    });
  }

  async run(message, args) {
    const guildDB = await Guild.findOne({
      guildId: message.guild.id,
    });

    const language = require(`../../data/language/${guildDB.language}.json`);

    var id = crypto.randomBytes(4).toString("hex");

    if (args.length < 1) {
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor(message.client.color.blue)
            .setDescription(
              `${message.client.emoji.fail} ${language.suggest1}`
            ),
        ],
      });
    }

    if (args.length < 3) {
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor(message.client.color.blue)
            .setDescription(
              `${message.client.emoji.fail} ${language.suggest2}`
            ),
        ],
      });
    }

    //args.join(' ').split('').join('')
    let invite = await message.channel
      .createInvite({
        maxAge: 0,
        maxUses: 0,
      })
      .catch(() => {});

    let report = args.join(" ").split("").join("");
    const embed = new MessageEmbed()
      .setTitle("New Suggestion")
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setDescription(report)
      .addFields(
        { name: "User", value: `${message.member}`, inline: true },
        {
          name: "User username",
          value: `${message.member.user.username}`,
          inline: true,
        },
        { name: "User ID", value: `${message.member.id}`, inline: true },
        { name: "User Tag", value: `${message.member.user.tag}`, inline: true },
        {
          name: "Server",
          value: `[${message.guild.name}](${invite || "none "})`,
          inline: true,
        },
        { name: "Feedback ID:", value: `#${id}`, inline: true }
      )
      .setFooter({
        text: message.member.displayName,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp()
      .setColor("GREEN");

    const confirmation = new MessageEmbed()
      .setTitle("Bot Suggestions")
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setDescription(
        `${language.suggest3} Support [**Server**](${config.discord})`
      )
      .addFields(
        { name: "Member", value: `${message.member}`, inline: true },
        { name: "Message", value: `${report}`, inline: true },
        { name: "Suggestion ID:", value: `#${id}`, inline: true }
      )
      .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
      .setTimestamp()
      .setColor("GREEN");

    webhookClient.sendCustom({
      username: `${config.botName} Suggestions`,
      avatarURL: `https://neonova.eyum.org/logo.png`,
      embeds: [embed],
    });

    message.delete().catch(() => {});
    message.author.send({ embeds: [confirmation] }).catch(() => {});
  }
};
