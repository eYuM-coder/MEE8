const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("eval")
    .setDescription("This is for the developers.")
    .addStringOption((option) => option.setName("thing-to-eval").setDescription("Thing to eval").setRequired(true))
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    const input = interaction.options.getString("thing-to-eval")

    if (!interaction.client.config.owner.includes(interaction.user.id) && !interaction.client.config.developers.includes(interaction.user.id)) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(`${interaction.client.emoji.fail} | You are not a developer or the owner of this bot.`)
        ], ephemeral: true
      })
    }

    if (!input) return interaction.reply(`What do I evaluate?`);
    if (!input.toLowerCase().includes("token")) {
      let embed = ``;

      try {
        let output = eval(input);
        if (typeof output !== "string")
          output = require("util").inspect(output, { depth: 0 });

        embed = `\`\`\`js\n${output.length > 1024 ? "Too large to display." : output
          }\`\`\``;
      } catch (err) {
        embed = `\`\`\`js\n${err.length > 1024 ? "Too large to display." : err
          }\`\`\``;
      }

      interaction.reply({ content: embed, ephemeral: true });
    } else {
      interaction.reply("Bruh you tryina steal my token huh?");
    }
  }
};