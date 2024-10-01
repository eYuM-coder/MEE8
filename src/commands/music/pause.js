const Command = require("../../structures/Command");
const player = require("../../handlers/player");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "pause",
      description: "Pauses the current track.",
      category: "Music",
    });
  }
  async run(message) {
    let member = message.guild.members.cache.get(message.author.id);
    let channel = member.voice.channel;
    if (!channel) {
      return message.channel.send(
        `You need to join a voice channel to use this command.`,
      );
    }

    let queue = player.getQueue(message.guild.id);
    if (!queue.songs) {
      return message.channel.send(`No songs are playing.`);
    } else if (queue.paused) {
      return message.channel.send(`Song is already paused.`);
    } else {
      await queue.pause();
      message.channel.send(`Song paused.`);
    }
  }
};
