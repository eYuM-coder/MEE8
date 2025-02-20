const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fart")
    .setDescription("ahem... fart.")
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const user = interaction.user;

      if (!user.dmChannel) {
        await user.createDM();
      }

      for (let i = 0; i < 12; i++) {
        await user.dmChannel.send("# fart.");
      }
      const successEmbed = new MessageEmbed()
        .setDescription("fart")
        .setColor(interaction.client.color.green);

      return interaction.editReply({ embeds: [successEmbed], ephemeral: true });
    } catch (err) {
      console.error(err);

      const failEmbed = new MessageEmbed()
        .setDescription("fart error. so no fart bru")
        .setColor(interaction.client.color.red);

      return interaction.editReply({ embeds: [failEmbed], ephemeral: true });
    }
  },
};
