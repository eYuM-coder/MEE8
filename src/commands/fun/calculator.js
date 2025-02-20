//  code is bugy rn
const Command = require("../../structures/Command");
const { Calculator } = require('weky');

module.exports = class CalculatorCommand extends Command {
  constructor(...args) {
    super(...args, {
      name: "calculator",
      description: "Open a calculator.",
      category: "Utility",
      usage: "calculator",
      guildOnly: true,
      aliases: ["cal"],
      cooldown: 3,
    });
  }

  async run(message, args) {
    const command = "calculator";

    try {
      await Calculator({
        message: message,
        embed: {
          title: 'Calculator ',
          color: '#5865F2',
          footer: 'mee8.eyum.org',
          timestamp: true,
        },
        disabledQuery: 'Calculator is disabled!',
        invalidQuery: 'The provided equation is invalid!',
        othersMessage: 'Only <@{{author}}> can use the buttons!',
      });
    } catch (error) {
      console.error('Error running calculator command:', error);
      message.reply('An error occurred while running the calculator command.');
    }
  }
};
