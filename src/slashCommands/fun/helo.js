const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("helo")
    .setDescription("Says hello to eYuM")
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    const member = await interaction.client.users.fetch("1067137336674107453");

    await interaction.reply({
      embeds: [
        new MessageEmbed()
          .setDescription(
            `helo <@1067137336674107453> <:TrollHappy:1058938513946591292>`
          )
          .setColor("BLURPLE"),
      ],
    });

    await member.send({ content: `${interaction.user} said hello to you!` });
  },
};
