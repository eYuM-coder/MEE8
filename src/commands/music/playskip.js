const Command = require("../../structures/Command");
const player = require("../../handlers/player");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "playskip",
      description: "Plays a song and skips to it",
      category: "Music",
    });
  }
  async run(message, args) {
    let member = message.guild.members.cache.get(message.author.id);
    let channel = member.voice.channel;
    if (!channel) {
      return message.channel.send(`You need to join a voice channel to use this command.`);
    }
    let song = args.join(" ");
    player.playVoiceChannel(channel, song, {
      member: member,
      textChannel: message.channel,
      skip: true,
    })
  }
}