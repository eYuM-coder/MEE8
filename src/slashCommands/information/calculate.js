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
    if (subcommand === "equation") {
      try {
        await interaction.deferReply();
        let input = interaction.options.getString("expression");

        // Fetch stored variables from the database
        const storedVars = await variablesDB.findOne({ _id: "variables" });
        const variables = storedVars ? storedVars.vars || {} : {}; // Extract variable object

        // Replace variables in the input expression
        for (const [varName, value] of Object.entries(variables)) {
          const regex = new RegExp(`\\b${varName}\\b`, "g"); // Match whole variable names
          input = input.replace(regex, value);
        }

        function safeEvaluate(expression) {
          try {
              const result = evaluateExpression(expression);
              return result;
          } catch (e) {
              throw new Error(`${e.message}`);
          }
      }
      
      function finalTransformString(input) {
          // Block inputs with numbers or underscores
          input = input.replace(/pi/gi, 'π'); // Normalize all forms of "pi" to lowercase
          
          // Insert * between π and a-z or A-Z
      input = input.replace(/π(?=[a-zA-Z])/g, 'π*');
      input = input.replace(/(?<=[a-zA-Z])π/g, '*π');
          
          if (/[_]/.test(input)) return null;
      
          return transformRecursive(input);
      }
      
      function transformRecursive(input, inFunction = false) {
          let result = '';
          let i = 0;
      
          while (i < input.length) {
              if (/[a-zA-Z]/.test(input[i])) {
                  // Check for function name followed by (
                  let j = i;
                  while (j < input.length && /[a-zA-Z]/.test(input[j])) j++;
      
                  if (input[j] === '(') {
                      // It's a function
                      const funcName = input.slice(i, j);
                      const { content, end } = extractParenContent(input, j);
      
                      // Recursively process inside the function
                      const transformedInner = transformRecursive(content, true);
                      result += funcName + '(' + transformedInner + ')';
                      i = end + 1;
                  } else {
                      // Regular word (not function)
                      const word = input.slice(i, j);
                      result += addAsterisks(word);
                      i = j;
                  }
              } else if (input[i] === '(') {
                  const { content, end } = extractParenContent(input, i);
                  const transformedInner = transformRecursive(content, false);
                  result += '(' + transformedInner + ')';
                  i = end + 1;
              } else {
                  result += input[i++];
              }
          }
      
          return result;
      }
      
      function extractParenContent(str, startIndex) {
          // Assumes str[startIndex] === '('
          let depth = 1;
          let i = startIndex + 1;
      
          while (i < str.length && depth > 0) {
              if (str[i] === '(') depth++;
              else if (str[i] === ')') depth--;
              i++;
          }
      
          return {
              content: str.slice(startIndex + 1, i - 1),
              end: i - 1
          };
      }
      
      function addAsterisks(word) {
          return word.replace(/([a-zA-Z])(?=[a-zA-Z])/g, '$1*');
      }
      
      function evaluateExpression(expression) {
          let final = finalTransformString(expression);
          const divisionByZeroRegex = /\d\s*\/\s*0(?!\s*\.\d)/;
          
          if (expression.match(divisionByZeroRegex)) {
              throw new Error("DIVIDE BY 0");
              return `DIVIDE BY 0`;
          }
          
          for (const [varName, value] of Object.entries(variables)) {
              const regex = new RegExp(`\\b${varName}\\b`, "g");
              final = final.replace(regex, value);
          }
      
          return nerdamer(final, variables).evaluate().text();
      }

      let result = safeEvaluate(input);

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
