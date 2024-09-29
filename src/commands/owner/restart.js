const Command = require("../../structures/Command");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "restart",
      aliases: ["reboot"],
      description: "Restart the bot!",
      category: "Owner",
    });
  }

  async run(message) {
    if (
      !message.client.config.owner.includes(message.author.id) &&
      message.client.config.developers.includes(message.author.id)
    ) {
      return message.channel.sendCustom(`This command is for the owner.`);
    }
    await message.channel
      .sendCustom("Restarting!")
      .catch((err) => this.client.console.error(err));
    process.exit(1);
  }
};
