const Command = require("../../structures/Command");
const player = require("../../handlers/player");
const { MessageEmbed } = require("discord.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "skip",
      description: "Skips the current song.",
      category: "Music",
      cooldown: 5,
    });
  }

  async run(message) {
    const embed = new MessageEmbed().setColor("RED");
    const queue = player.getQueue(message.guildId);
    if (!queue || !queue.playing) {
      embed.setDescription(`No music is currently playing.`);
      return message.channel.send({ embeds: [embed] });
    }
    let success;
    if (queue.songs.length > 1) {
      success = queue.skip();
    } else {
      success = queue.stop();
    }
    embed.setDescription(
      success ? `Skipped Current Song.` : "Something went wrong.",
    );
    return message.channel.send({ embeds: [embed] });
  }
};
