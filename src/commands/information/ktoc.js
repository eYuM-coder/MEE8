const Command = require("../../structures/Command")
const { MessageEmbed } = require("discord.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "ktoc",
      description: "Converts Kelvin to Celsius",
      category: "Information",
      cooldown: 3,
    });
  }
  async run(message, args) {
    const kelvin = args[0];
    if (isNaN(kelvin)) return message.channel.sendCustom("Not a valid number!");
    const celsius = kelvin - 273.15;
    message.channel.sendCustom({ content: `${celsius.toFixed(2)}°C` });
  }
}