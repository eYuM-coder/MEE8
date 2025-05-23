const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const Snipe = require("../../database/schemas/editsnipe");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "editsnipe",
      description: "Snipe Edited Messages in the channel",
      category: "Utility",
      usage: ["editsnipe"],
      cooldown: 10,
    });
  }

  async run(message) {
    let channel = message.mentions.channels.first();
    if (!channel) channel = message.channel;

    const snipe = await Snipe.findOne({
      guildId: message.guild.id,
      channel: channel.id,
    });

    const no = new MessageEmbed()
      .setAuthor({
        name: `#${channel.name} | ${message.guild.name}`,
        iconURL: message.guild.iconURL(),
      })
      .setFooter({ text: message.guild.name })
      .setTimestamp()
      .setColor(message.guild.members.me.displayHexColor)
      .setDescription(
        `${message.client.emoji.fail} | Couldn't find any edited message in **${channel.name}**`
      );

    if (!snipe) {
      return message.channel.sendCustom(no);
    }

    if (snipe.oldmessage.length < 1) {
      return message.channel.sendCustom(no);
    }
    if (snipe.newmessage.length < 1) {
      return message.channel.sendCustom(no);
    }

    const data = [];

    const embed = new MessageEmbed()
      .setAuthor({
        name: `#${channel.name} | ${message.guild.name}`,
        iconURL: message.guild.iconURL(),
      })
      .setFooter({ text: message.guild.name })
      .setTimestamp()
      .setColor(message.guild.members.me.displayHexColor);

    for (let i = 0; snipe.oldmessage.length > i; i++) {
      data.push(`**${i + 1}**`);

      embed.addFields({
        name: `Message #${i + 1}`,
        value: `**User:** ${
          (await message.client.users.fetch(snipe.id[i])) || "Unknown"
        }\n**Message:** ${snipe.oldmessage[i] || "None"} ➜ ${
          snipe.newmessage[i]
        }\n[Jump To Message](${snipe.url[i]})\n`,
      });
    }

    if (data.length < 1) return message.channel.sendCustom(no);

    message.channel.sendCustom({ embeds: [embed] }).catch(async () => {
      await snipe.deleteOne().catch(() => {});
      message.channel.sendCustom(
        `The embed contained a huge field that couldn't fit as this is the reason i failed to send the embed. I have resetted the database as you can try rerunning the command again.`
      );
    });
  }
};
