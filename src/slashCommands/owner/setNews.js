const { SlashCommandBuilder } = require("@discordjs/builders");
const config = require("../../../config.json");
const { MessageEmbed } = require("discord.js");
const NewsSchema = require("../../database/schemas/MEE8");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setnews")
    .setDescription("This is for the developer.")
    .addStringOption((option) =>
      option
        .setName("text")
        .setDescription("The text you want to set")
        .setRequired(true)
    )
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    let news = interaction.options.getString("text");
    const newsDB = await NewsSchema.findOne({});
    if (!newsDB) {
      await NewsSchema.create({
        news: news,
        time: new Date(),
      });

      return interaction.reply({ content: "News set.", ephemeral: true });
    }

    if (
      !interaction.client.config.owner.includes(interaction.user.id) &&
      interaction.client.config.developers.includes(interaction.user.id)
    ) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(
              `${interaction.client.emoji.fail} | This command is for the owner.`
            ),
        ],
        ephemeral: true,
      });
    }

    await NewsSchema.findOneAndUpdate(
      {},
      {
        news: news,
        time: new Date(),
      }
    );
  },
};
