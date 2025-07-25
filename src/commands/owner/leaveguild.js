const Command = require("../../structures/Command");
const rgx = /^(?:<@!?)?(\d+)>?$/;
const { MessageEmbed } = require("discord.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "leaveguild",
      aliases: ["lg"],
      description: "Leave a guild!",
      category: "Owner",
      ownerOnly: true,
    });
  }

  async run(message, args) {
    const guildId = args[0];
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
    if (!rgx.test(guildId))
      return message.channel.sendCustom(`Provide a guild`);
    const guild = message.client.guilds.cache.get(guildId);
    if (!guild) return message.channel.sendCustom(`Invalid guild ID`);
    await guild.leave();
    const embed = new MessageEmbed()
      .setTitle("Leave Guild")
      .setDescription(`I have successfully left **${guild.name}**.`)
      .setFooter({
        text: message.member.displayName,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp()
      .setColor(message.guild.members.me.displayHexColor);
    message.channel.sendCustom({ embeds: [embed] });
  }
};
