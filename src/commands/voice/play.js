const Command = require("../../structures/Command");
const player = require("../../handlers/player");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "play",
      aliases: ["p"],
      description: "Plays a song from youtube",
      category: "Music",
      usage: "play <song_name>",
    });
  }
  async run(message, args) {
    let member = message.guild.members.cache.get(message.author.id);
    let channel = member.voice.channel;
    if(!channel) {
      return message.channel.send(`You need to join a voice channel to use this command.`);
    }
    let song = args.join(" ");
    if (!song) {
      return message.channel.send(`Please provide a song name or a link.`);
    }

    try {
      await player.playVoiceChannel(channel, song, {
        member: member,
        textChannel: message.channel,
      });

      message.channel.send(`Searching for **${song}**...`);
    } catch (error) {
      console.error(error);
      message.channel.send(`An error occurred while trying to play the song.`);
    }

    message.channel.send(`Playing **${song}**.`);
  }
};