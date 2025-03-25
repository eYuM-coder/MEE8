const { SlashCommandBuilder } = require("@discordjs/builders");
const variables = require("../../database/schemas/variables.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("delvar")
    .setDescription("Deletes a global variable from the database")
    .addStringOption((option) =>
      option
        .setName("variable")
        .setDescription("The variable to delete (a-z)")
        .setRequired(true)
    )
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),

  async execute(interaction) {
    try {
      const variable = interaction.options.getString("variable").toLowerCase();

      if (!/^[a-z]$/.test(variable)) {
        return interaction.reply({
          content: "Invalid variable name! Use a single letter (a-z).",
          ephemeral: true,
        });
      }

      // Fetch the current variables
      const data = await variables.findOne({ _id: "variables" });
      if (!data || !data.vars || !(variable in data.vars)) {
        return interaction.reply({
          content: `Variable \`${variable}\` is not defined.`,
          ephemeral: true,
        });
      }

      // Delete the variable
      await variables.updateOne(
        { _id: "variables" },
        { $unset: { [`vars.${variable}`]: "" } }
      );

      return interaction.reply({
        content: `Global variable \`${variable}\` has been deleted.`,
        ephemeral: false,
      });
    } catch (err) {
      return interaction.reply({
        content: `ERROR: ${err.constructor.name
          .replace("Error", "")
          .toUpperCase()}. An error occurred while processing your request!`,
        ephemeral: true,
      });
    }
  },
};
