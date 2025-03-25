const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  entersState,
  VoiceConnectionStatus,
} = require("@discordjs/voice");
const path = require("path");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("brick")
    .setDescription("brick.mp3")
    .setContexts(0)
    .setIntegrationTypes(0),

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({
        content: "You need to be in a voice channel to use this command.",
        ephemeral: true,
      });
    }

    const audioPath = path.join(__dirname, "../../assets/audio/brick.mp3");
    if (!fs.existsSync(audioPath)) {
      return interaction.reply({ content: "..?", ephemeral: true });
    }

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: interaction.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: true,
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 5000);
    } catch (error) {
      console.error("Failed to join VC:", error);
      connection.destroy();
      return interaction.reply({
        content: "Failed to join the voice channel.",
        ephemeral: true,
      });
    }

    const player = createAudioPlayer();
    const resource = createAudioResource(audioPath);

    player.play(resource);
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => {
      connection.destroy();
    });

    player.on("error", (error) => {
      console.error("Audio Player Error:", error);
      connection.destroy();
    });

    interaction.reply({ content: "Playing brick.mp3", ephemeral: true });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5000),
        ]);
      } catch {
        connection.destroy();
      }
    });
  },
};
