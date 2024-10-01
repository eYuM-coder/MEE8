const Command = require("../../structures/Command");
const player = require("../../handlers/player");
const { MessageEmbed } = require("discord.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "queue",
      aliases: ["songs", "songlist"],
      description: "Displays the current queue.",
      category: "Music",
      cooldown: 3,
    });
  }
  async run(message) {
    const queue = player.getQueue(message.guildId);
    if (!queue || !queue.playing)
      return message.channel.send({ content: "❌ | No music is currently playing." });
    if (!queue.songs)
      return message.channel.send({ content: "❌ | No music in the queue after the current one." });
    const embed = new MessageEmbed()
      .setAuthor({
        name: `Server Queue - ${message.guild.name}`,
        iconURL: message.guild.iconURL({ dynamic: true }),
      })
      .setDescription(
        `${queue.songs
          .map(
            (track, i) =>
              `${i + 1}. **[${track.name}](${track.url})** | ${track.uploader.name} (${track.member}) | \`${track.formattedDuration}\``
          )
          .slice(0, 10)
          .join("\n")}`,
      )
      .setTimestamp();
    message.channel.send({ embeds: [embed] });
  }
}