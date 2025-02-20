const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Logging = require("../../database/schemas/logging.js");
const Guild = require("../../database/schemas/Guild");
const { stripIndent } = require("common-tags");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Returns the ping of the bot.")
    .setContexts([0, 1, 2])
    .setIntegrationTypes(0),
  async execute(interaction) {
    let guildDB = {};
    try {
      guildDB = await Guild.findOne({
        guildId: interaction.guild.id,
      });
    } catch {
      guildDB = { language: "english" };
    }
    const client = interaction.client;
    const language = require(`../../data/language/${guildDB.language}.json`);
    const embed = new MessageEmbed()
      .setDescription(`Pinging...`)
      .setColor(client.color.red)
      .setFooter({ text: `Powered by ${process.env.AUTH_DOMAIN}` });

    const msg = await interaction.reply({ embeds: [embed], fetchReply: true });

    const vowel = ["a", "e", "i", "u", "u"];

    const latency = msg.createdTimestamp - interaction.createdTimestamp;

    let koko = stripIndent`
        **${language.timeTaken}** \`${latency}ms\`
        **${language.discordAPI}** \`${Math.round(client.ws.ping)}ms\`
        `;

    let color = "";
    if (latency < 100) {
      color = `#00ff00`;
    } else if (latency > 100 && latency < 200) {
      color = `#CCCC00`;
    } else if (latency > 200) {
      color = interaction.client.color.red;
    }

    embed.setDescription(
      `P${vowel[Math.floor(Math.random() * vowel.length)]}ng\n${koko}`
    );
    embed.setColor(color);
    interaction.editReply({ embeds: [embed] });
  },
};
