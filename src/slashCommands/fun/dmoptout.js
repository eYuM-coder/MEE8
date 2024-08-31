const { SlashCommandBuilder } = require("@discordjs/builders");
const Logging = require("../../database/schemas/logging");
const { MessageEmbed } = require("discord.js");
const dmSystem = require("../../database/models/dmSystem");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dmoptout")
    .setDescription("Opts out of the DM system"),
  async execute(interaction) {
    try {
      const logging = await Logging.findOne({ guildId: interaction.guild.id });

      const dmsystem = await dmSystem.findOne({ userId: interaction.author.id });
      if (!dmsystem) {
        const newDmSystem = new dmSystem({
          userId: interaction.author.id,
          optedout: "true",
        });

        await newDmSystem.save();
        const embed = new MessageEmbed()
          .setDescription(`DM System profile created.`);
        return interaction.reply({ embeds: [embed] })
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
            userId: interaction.author.id,
          },
          { $set: { optedout: "true" } }
        );
        const dmoptout = new MessageEmbed()
          .setDescription(`You have opted out of the DM system. To begin recieving DMs again, use /dmoptin.`);
        return interaction.reply({ embeds: [dmoptout] })
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
      interaction.reply({ content: `This command cannot be used in Direct Messages.`, ephemeral: true });
    }
  }
};