const { SlashCommandBuilder } = require("@discordjs/builders");
const variables = require("../../database/schemas/variables.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setvar")
    .setDescription("Sets a global variable in the database")
    .addStringOption((option) =>
      option
        .setName("variable")
        .setDescription("The variable to set (a-z)")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("value")
        .setDescription("The value to set (numbers only)")
        .setRequired(true)
    )
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),

  async execute(interaction) {
    try {
      const variable = interaction.options.getString("variable").toLowerCase();
      const value = parseFloat(interaction.options.getString("value"));

      if (!/^[a-z]$/.test(variable)) {
        return interaction.reply({
          content: "Invalid variable name! Use a single letter (a-z).",
          ephemeral: true,
        });
      }
      if (isNaN(value)) {
        return interaction.reply({
          content: "Invalid number! Please provide a valid numerical value.",
          ephemeral: true,
        });
      }

      // Update variable storage
      await variables.updateOne(
        { _id: "variables" },
        { $set: { [`vars.${variable}`]: value } },
        { upsert: true }
      );

      // Update cached users
      const cache = await variables.findOne({ _id: "user_cache" });
      let cachedUserIDs = cache ? cache.user_ids : [];

      if (!cachedUserIDs.includes(interaction.user.id)) {
        cachedUserIDs.push(interaction.user.id);
        await variables.updateOne(
          { _id: "user_cache" },
          { $set: { user_ids: cachedUserIDs } },
          { upsert: true }
        );
      }

      return interaction.reply({
        content: `Global variable \`${variable}\` set to \`${value}\`.`,
        ephemeral: false,
      });
    } catch (err) {
      return interaction.reply({
        content: `ERROR: ${err.constructor.name
          .replace("Error", "")
          .toUpperCase()}. Ensure values are properly formatted!`,
        ephemeral: true,
      });
    }
  },
};
