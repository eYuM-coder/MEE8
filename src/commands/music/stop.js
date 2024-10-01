const Command = require("../../structures/Command");
const player = require("../../handlers/player");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "stop",
      description: "Stops the current playing song.",
      category: "Music",
      cooldown: 3,
    });
  }

  async run(message) {
    let member = message.guild.members.cache.get(message.author.id);
    let channel = member.voice.channel;
    if (!channel) {
      return message.channel.send("You need to be in a voice channel to use this command.");
    }
    const queue = player.getQueue(message.guild.id);
    if (!queue) return message.channel.send("There are no songs playing.");

    if (!queue || !queue.playing) return message.channel.send("No music is being played.");

    queue.stop();
    return message.reply("Stopped the player and disconnected from the channel.");
  }
}