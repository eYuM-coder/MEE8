const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { exec } = require("child_process");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("exec")
    .setDescription("This is for the developers")
    .addStringOption((option) =>
      option
        .setName("thing-to-exec")
        .setDescription("The thing to execute")
        .setRequired(true)
    )
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const thing = interaction.options.getString("thing-to-exec");

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

    if (thing.toLowerCase().includes("config.json"))
      return interaction.reply({
        content: "Due to privacy reasons, we can't show the config.json file.",
      });

    if (thing.length < 1)
      return interaction.editReply({
        content: "You have to give me some text to execute!",
      });

    interaction.editReply({
      content: `Please wait while the command is being processed... This may take a while.`,
      fetchReply: true,
      ephemeral: true,
    });

    exec(thing, (error, stdout) => {
      const response = stdout || error;
      interaction.editReply({ content: `${response}`, ephemeral: true });
    });
  },
};
