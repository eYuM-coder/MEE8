const Command = require("../../structures/Command");
const config = require("../../../config.json");
const player = require("../../handlers/player");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "jump",
      description: "Jumps to a specific song in the queue",
      category: "Music",
      aliases: ["skipto"],
    });
  }
  async run(message, args) {
    let member = message.guild.members.cache.get(message.author.id);
    let channel = member.voice.channel;
    if (!channel) {
      return message.reply(`You need to join a voice channel.`);
    }
    let queue = player.getQueue(message.guild.id);
    let position = args[0];
    if (!queue.songs) {
      return message.reply(`No songs are playing.`);
    } else if (!position) {
      return message.reply(`Provide a valid number.`);
    } else {
      await queue.jump(position);
      message.channel.send(`Jumped to ${queue.songs[position].name}.`);
    }
  }
}