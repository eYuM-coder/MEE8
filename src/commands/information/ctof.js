const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "ctof",
      description: "Converts Celsius to Fahrenheit",
      category: "Information",
      cooldown: 3,
    });
  }

  async run(message, args) {
    const celsius = args[0];
    if (isNaN(celsius)) {
      return message.reply("Not a valid number!");
    }

    const fahrenheit = (celsius * 9) / 5 + 32;

    return message.channel.sendCustom({ content: `${fahrenheit.toFixed(2)}°F.` });
  }
}