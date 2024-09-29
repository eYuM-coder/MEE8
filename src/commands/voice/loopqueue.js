const Command = require("../../structures/Command");
const player = require("../../handlers/player");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "loopqueue",
      description: "Loop the queue",
      category: "Music",
      cooldown: 3,
    });
  }

  async run(message) {
    let member = message.guild.members.cache.get(message.author.id);
    let channel = member.voice.channel;
    const queue = player.getQueue(message.guildId);
    if(!channel) {
      return message.channel.send({ content: "You need to be in a voice channel to use this command." });
    }
    if (!queue) return message.channel.send("No songs in queue!");

    queue.setRepeatMode(queue.repeatMode === 0 ? 2 : 0);
    const loopmode = queue.repeatMode === 0 ? "Disabled" : "Enabled";
    return message.channel.send(`Loop mode is now ${loopmode} for the queue.`);
  }
}