const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "ftoc",
      description: "Converts Fahrenheit to Celsius",
      category: "Information",
      cooldown: 3,
    });
  }
  async run(message, args) {
    const fahrenheit = args[0];
    if (isNaN(fahrenheit)) {
      return message.reply("Not a valid number!");
    }
    const celsius = (fahrenheit - 32) * 5 / 9;
    return message.channel.sendCustom({ content: `${celsius.toFixed(2)}°C`});
  }
}