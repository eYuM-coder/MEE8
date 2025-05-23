const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const Guild = require("../../database/schemas/Guild");
const ReactionMenu = require("../../data/ReactionMenu.js");
module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "emojis",
      description: `Check the curent guild's emojis`,
      category: "Information",
      cooldown: 3,
    });
  }

  async run(message) {
    const guildDB = await Guild.findOne({
      guildId: message.guild.id,
    });

    const language = require(`../../data/language/${guildDB.language}.json`);

    const emojis = [];
    message.guild.emojis.cache.forEach((e) =>
      emojis.push(`\u0009 ${e} **—** \`:${e.name}:\``)
    );

    const embed = new MessageEmbed()
      .setAuthor({
        name: `${language.emoji1}`,
        iconURL: message.guild.iconURL({ dynamic: true }),
      })
      .setFooter({
        text: message.author.tag,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp()
      .setColor(message.guild.members.me.displayHexColor);

    const interval = 25;
    if (emojis.length === 0)
      message.channel.sendCustom(embed.setDescription(`${language.emoji2}`));
    else if (emojis.length <= interval) {
      const range = emojis.length == 1 ? "[1]" : `[1 - ${emojis.length}]`;
      message.channel.sendCustom(
        embed
          .setAuthor({
            name: `${language.emoji1} ${range}`,
            iconURL: message.guild.iconURL({ dynamic: true }),
          })
          .setDescription(emojis.join("\n"))
      );

      // Reaction Menu
    } else {
      embed
        .setAuthor({
          name: `${language.emoji1}`,
          iconURL: message.guild.iconURL({ dynamic: true }),
        })
        .setFooter({
          text: message.author.tag,
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        });

      new ReactionMenu(
        message.client,
        message.channel,
        message.member,
        embed,
        emojis,
        interval
      );
    }
  }
};
