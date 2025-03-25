const Command = require("../../structures/Command")
const { MessageEmbed } = require("discord.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "ktof",
      description: "Converts Kelvin to Fahrenheit",
      category: "Information",
      cooldown: 3,
    });
  }
  async run(message, args) {
    const kelvin = args[0];
    if (isNaN(kelvin)) return message.channel.sendCustom("Not a valid number!");
    const farhenheit = (kelvin - 273.15) * 9 / 5 + 32;
    message.channel.sendCustom({ content: `${farhenheit.toFixed(2)}°F` });
  }
}