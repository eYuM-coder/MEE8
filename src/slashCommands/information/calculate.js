const { SlashCommandBuilder } = require("@discordjs/builders");
const nerdamer = require("nerdamer/all.min"); // Use nerdamer
const variablesDB = require("../../database/schemas/variables"); // Database schema for variables

module.exports = {
  data: new SlashCommandBuilder()
    .setName("calculate")
    .setDescription("Calculate an expression with stored variables!")
    .addStringOption((option) =>
      option
        .setName("expression")
        .setDescription("The equation to evaluate")
        .setRequired(true)
    )
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),

  async execute(interaction) {
    try {
      let input = interaction.options.getString("expression");

      input = input
        .replace(/(?<=[a-zA-Z])(?=\d)/g, "*")
        .replace(/(?<=[a-zA-Z])(?=[a-zA-Z])/g, "*");

      // Fetch stored variables from the database
      const storedVars = await variablesDB.findOne({ _id: "variables" });
      const variables = storedVars ? storedVars.vars || {} : {}; // Extract variable object

      // Replace variables in the input expression
      for (const [varName, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\b${varName}\\b`, "g"); // Match whole variable names
        input = input.replace(regex, value);
      }

      function evaluateExpression(expression) {
        let result;
        try {
          result = nerdamer(expression, variables).evaluate().text();

          if (expression.includes("/0")) {
            throw new Error("DIVIDE BY 0");
          } else if (result === Infinity) {
            throw new Error("OVERFLOW");
          }
        } catch (e) {
          console.error(e);
          if (e.constructor.name == "SyntaxError") {
            return `ERROR: ${e.constructor.name
              .replace("Error", "")
              .toUpperCase()}`;
          } else if (e.constructor.name === "Error") {
            return `ERROR: ${e}`;
          } else {
            return tokens.join("");
          }
        }
        return result;
      }

      // Evaluate the final expression with mathjs
      const result = evaluateExpression(input);

      // Send the result
      await interaction.reply({ content: `Result: \`${result}\`` });
    } catch (err) {
      await interaction.reply({
        content: `ERROR: Invalid expression!`,
        ephemeral: true,
      });
    }
  },
};
