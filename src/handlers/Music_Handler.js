const distube = require('./player');

module.exports = async (client) => {
  distube.on("playSong", (queue, song) => {
    queue.textChannel.send(
      `Playing \`${song.name}\` - \`${song.formattedDuration}\`\nRequested by: ${song.user}`
    )
  });

  distube.on("addSong", (queue, song) => {
    queue.textChannel.send(
      `Added ${song.name} - \`${song.formattedDuration}\` to the queue by ${song.user}.`
    )
  });

  distube.on("addList", (queue, playlist) => {
    queue.textChannel.send(
      `Added \`${playlist.name}\` playlist (${playlist.songs.length} songs) to the queue!`
    )
  });
  distube.on('disconnect', (queue) => {
    queue.textChannel.send(`Song Ended`)
  } )

  distube.on("initQueue", queue => {
    queue.autoplay = false;
    queue.volume = 100;
});
}