const Command = require("../../structures/Command");
const player = require("../../handlers/player");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "loop",
      aliases: ["lp", "repeat"],
      description: "Loops the current queue",
      category: "Music",
    });
  }
  async run(message) {
    let member = message.guild.members.cache.get(message.author.id);
    let channel = member.voice.channel;
    if(!channel) {
      return message.channel.send(`You need to be in a voice channel to use this command.`);
    }
    let queue = player.getQueue(message.guild.id);
    if(!queue.songs) {
      return message.channel.send(`There is nothing playing.`);
    }
    if (queue.repeatMode === 1) {
      queue.setRepeatMode(0)
      return message.channel.send(`Loop mode is now disabled for this song.`);
    } else {
      queue.setRepeatMode(1);
      message.channel.send(`Loop mode is now enabled for this song.`);
    }
  }
}