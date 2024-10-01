const Command = require("../../structures/Command");
const config = require("../../../config.json");
const player = require("../../handlers/player");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "clearqueue",
      description: "Clears the queue",
      category: "Music",
    });
  }
  async run(message, args) {
    let member = message.guild.members.cache.get(message.author.id);
    let channel = member.voice.channel;
    if(!channel) {
      return message.channel.send(`You need to join a voice channel to use this command.`);
    }
    let queue = player.getQueue(message.guild.id);
    if (!queue.songs) {
      return message.channel.send(`No songs are in the queue.`);
    } else {
      await queue.delete();
      message.channel.send(`Queue cleared.`);
    }
  }
}