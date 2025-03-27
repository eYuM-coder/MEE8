const { SlashCommandBuilder } = require("@discordjs/builders");
const nerdamer = require("nerdamer/all.min"); // Use nerdamer
const variablesDB = require("../../database/schemas/variables"); // Database schema for variables

module.exports = {
  data: new SlashCommandBuilder()
    .setName("calculate")
    .setDescription("Calculate an expression with stored variables!")
    .addSubcommandGroup((group) =>
      group
        .setName("temp-conversion")
        .setDescription(
          "Converts a temperature unit to Fahrenheit, Celsius, or Kelvin!",
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("ctof")
            .setDescription("Converts Celsius to Fahrenheit")
            .addStringOption((option) =>
              option
                .setName("celsius")
                .setDescription("Celsius temperature to convert")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("ctok")
            .setDescription("Converts Celsius to Kelvin")
            .addStringOption((option) =>
              option
                .setName("celsius")
                .setDescription("Celsius temperature to convert")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("ftoc")
            .setDescription("Calculates Fahrenheit to Celsius")
            .addStringOption((option) =>
              option
                .setName("fahrenheit")
                .setDescription("Temperature in Fahrenheit")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("ftok")
            .setDescription("Calculates Fahrenheit to Kelvin")
            .addStringOption((option) =>
              option
                .setName("fahrenheit")
                .setDescription("Temperature in Fahrenheit")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("ktoc")
            .setDescription("Calculates Kelvin to Celsius")
            .addStringOption((option) =>
              option
                .setName("kelvin")
                .setDescription("Temperature in Kelvin")
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("ktof")
            .setDescription("Calculates Kelvin to Fahrenheit")
            .addStringOption((option) =>
              option
                .setName("kelvin")
                .setDescription("Temperature in Kelvin")
                .setRequired(true),
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("equation")
        .setDescription("Calculates an equation!")
        .addStringOption((option) =>
          option
            .setName("expression")
            .setDescription("The equation to evaluate")
            .setRequired(true),
        ),
    )
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const subcommandGroup = interaction.options.getSubcommandGroup();
    if (subcommandGroup === "temp-conversion") {
      if (subcommand === "ctof") {
        const celsius = interaction.options.getString("celsius");
        if (isNaN(celsius))
          return interaction.reply({
            content: "Not a valid number!",
            ephemeral: true,
          });

        const fahrenheit = (celsius * 9) / 5 + 32;
        return interaction.reply({ content: `${fahrenheit.toFixed(2)}°F` });
      } else if (subcommand === "ctok") {
        const celsius = interaction.options.getString("celsius");
        if (isNaN(celsius))
          return interaction.reply({
            content: "Not a valid number!",
            ephemeral: true,
          });

        const kelvin = celsius + 273.15;
        return interaction.reply({ content: `${kelvin.toFixed(2)}°K` });
      } else if (subcommand === "ftoc") {
        const fahrenheit = interaction.options.getString("fahrenheit");
        if (isNaN(fahrenheit))
          return interaction.reply({
            content: "Not a valid number!",
            ephemeral: true,
          });

        const celsius = ((fahrenheit - 32) * 5) / 9;
        return interaction.reply({ content: `${celsius.toFixed(2)}°C` });
      } else if (subcommand === "ftok") {
        const fahrenheit = interaction.options.getString("fahrenheit");
        if (isNaN(fahrenheit))
          return interaction.reply({
            content: "Not a valid number!",
            ephemeral: true,
          });

        const kelvin = ((fahrenheit - 32) * 5) / 9 + 273.15;
        return interaction.reply({ content: `${kelvin.toFixed(2)}°K` });
      } else if (subcommand === "ktoc") {
        const kelvin = interaction.options.getString("kelvin");
        if (isNaN(kelvin))
          return interaction.reply({
            content: "Not a valid number!",
            ephemeral: true,
          });

        const celsius = kelvin - 273.15;
        return interaction.reply({ content: `${celsius.toFixed(2)}°C` });
      } else if (subcommand === "ktof") {
        const kelvin = interaction.options.getString("kelvin");
        if (isNaN(kelvin))
          return interaction.reply({
            content: "Not a valid number!",
            ephemeral: true,
          });

        const fahrenheit = ((kelvin - 273.15) * 9) / 5 + 32;
        return interaction.reply({ content: `${fahrenheit.toFixed(2)}°F` });
      }
    }
    if (subcommand === "equation") {
      try {
        await interaction.deferReply();
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
            if (expression.includes("/0")) {
              throw new Error("DIVIDE BY 0");
            }

            result = nerdamer(expression, variables).evaluate().text();

            if (result === "Infinity") {
              throw new Error("OVERFLOW");
            }
          } catch (e) {
            console.log(e.constructor);
            console.error(e);
            if (e.constructor.name == "SyntaxError") {
              return `ERROR: ${e.constructor.name
                .replace("Error", "")
                .toUpperCase()}`;
            } else if (e.constructor.name === "Error") {
              return `ERROR: ${e.message}`;
            } else {
              return tokens.join("");
            }
          }
          return result;
        }

        // Evaluate the final expression with mathjs
        const result = evaluateExpression(input);

        // Send the result
        await interaction.editReply({ content: `Result: \`${result}\`` });
      } catch (err) {
        await interaction.editReply({
          content: `ERROR: Invalid expression!`,
          ephemeral: true,
        });
      }
    }
  },
};
