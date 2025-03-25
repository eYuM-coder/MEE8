const Command = require("../../structures/Command")
const { MessageEmbed } = require("discord.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "ftok",
      description: "Converts Fahrenheit to Kelvin",
      category: "Information",
      cooldown: 3,
    });
  }
  async run(message, args) {
    const fahrenheit = args[0];
    if (isNaN(fahrenheit)) return message.channel.sendCustom("Not a valid number!");
    const kelvin = (fahrenheit - 32) * 5 / 9 + 273.15;
    message.channel.sendCustom({ content: `${kelvin.toFixed(2)}°K` });
  }
}