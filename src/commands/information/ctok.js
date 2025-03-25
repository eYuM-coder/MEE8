const Command = require("../../structures/Command")
const { MessageEmbed } = require("discord.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "ctok",
      description: "Converts Celsius to Kelvin",
      category: "Information",
      cooldown: 3,
    });
  }
  async run(message, args) {
    const celsius = args[0];
    if (isNaN(celsius)) return message.channel.sendCustom("Not a valid number!");
    const kelvin = celsius + 273.15;
    message.channel.sendCustom({ content: `${kelvin.toFixed(2)}°K` });
  }
}