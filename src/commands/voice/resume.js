const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const player = require("../../handlers/player");

module.exports = class Resume extends Command {
  constructor(...args) {
    super(...args, {
      name: "resume",
      aliases: ["unpause"],
      description: "Resumes the current song.",
      category: "Music",
      usage: "",
      accessableby: "Everyone",
    });
  }

  async run(message) {
    let member = message.guild.members.cache.get(message.author.id);
    let channel = member.voice.channel;
    if(!channel) {
      return message.channel.send({ content: "You need to be in a voice channel to resume the music." });
    }
    const queue = player.getQueue(message.guildId);
    if (!queue) return message.channel.send("No songs in queue.");
    const paused = queue.paused;
    if (paused) {
      queue.resume();
      return message.channel.send("Resumed the current song.");
    } else {
      return message.channel.send("The song is already resumed.");
    }
  }
}