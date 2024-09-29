const Distube = require('distube').default;
const client = require('../../index');
const { SpotifyPlugin } = require("@distube/spotify");
const { SoundCloudPlugin } = require("@distube/soundcloud");

let player = new Distube(client, {
  emitNewSongOnly: false,
  leaveOnEmpty: false,
  leaveOnFinish: false,
  leaveOnStop: true,
  savePreviousSongs: true,
  searchSongs: 0,
  youtubeDL: true,
  plugins: [new SpotifyPlugin(), new SoundCloudPlugin()],
})

module.exports = player;