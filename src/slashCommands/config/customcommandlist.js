const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const customCommand = require("../../database/schemas/customCommand.js");
const Guild = require("../../database/schemas/Guild");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("customcommandlist")
    .setDescription("Show's a list of custom commands")
    .setContexts(0)
    .setIntegrationTypes(0),
  async execute(interaction) {
    const guildDB = await Guild.findOne({
      guildId: interaction.guild.id,
    });

    const language = require(`../../data/language/${guildDB.language}.json`);

    await customCommand.find(
      {
        guildId: interaction.guild.id,
      },
      (err, data) => {
        if (!data && !data.name)
          return interaction.reply({
            content: `${interaction.client.emoji.fail} | ${language.cc5}`,
          });
        let array = [];
        data.map((d) => array.push(d.name));

        let embed = new MessageEmbed()
          .setColor("PURPLE")
          .setTitle(`${language.cc6}`)
          .setFooter({ text: interaction.guild.name });

        if (!Array.isArray(array) || !array.length) {
          embed.setDescription(`${language.cc5}`);
        } else {
          embed.setDescription(array.join(" - "));
        }

        interaction.reply({ embeds: [embed] });
      }
    );
  },
};
