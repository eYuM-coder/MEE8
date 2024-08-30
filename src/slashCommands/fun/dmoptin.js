const { SlashCommandBuilder } = require("@discordjs/builders");
const Logging = require("../../database/schemas/logging");
const { MessageEmbed } = require("discord.js");
const dmSystem = require("../../database/models/dmSystem");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dmoptout")
    .setDescription("Opts out of the DM command"),
  async execute(interaction) {
    try {
      const client = interaction.client;
      const logging = await Logging.findOne({ guildId: interaction.guild.id });

      const dmsystem = await dmSystem.findOne({ userId: interaction.author.id });
      if (!dmsystem) {
        await new dmSystem({
          userId: interaction.author.id,
          optedout: true,
        });
        const dmoptin = new MessageEmbed()
          .setDescription(`You have opted in to the DM system. To stop recieving DMs, use /dmoptout.`);
        return interaction.reply({ embeds: [dmoptin] })
          .then(async () => {
            if (logging && logging.moderation.delete_reply === "true") {
              setTimeout(() => {
                interaction.deleteReply().catch(() => { interaction.channel.send({ content: "Error deleting message." }) });
              }, 5000)
            }
          })
          .catch(() => { interaction.channel.send({ content: "Error deleting message." }) });
      } else {
        await dmSystem.updateOne(
          {
            userId: message.author.id,
          },
          { $set: { optedout: false } }
        );
        const dmoptin = new MessageEmbed()
          .setDescription(`You have opted in to use the DM system. To stop recieving DMs, use /dmoptout.`);
        return interaction.reply({ embeds: [dmoptin] })
          .then(async () => {
            if (logging && logging.moderation.delete_reply === "true") {
              setTimeout(() => {
                interaction.deleteReply().catch(() => { interaction.channel.send({ content: "Error deleting message." }) });
              }, 5000)
            }
          })
          .catch(() => { interaction.channel.send({ content: "Error deleting message." }) });
      }
    } catch (err) {
      console.error();
    }
  }
};