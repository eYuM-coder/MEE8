const Command = require("../../structures/Command");
const { exec } = require("child_process");

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
      (!message.client.config.developers.includes(message.author.id) ||
        message.client.config.developers.includes(message.author.id))
    ) {
      return message.channel.sendCustom(`This command is for the owner.`);
    }

    try {
      await message.channel.sendCustom("Deploying and restarting...");

      exec("neonova deploy", (error, stdout) => {
        const response = error || stdout;
        console.log(response);

        if (error) {
          message.channel.sendCustom(
            `Deployment failed:\n\`\`\`${error.message}\`\`\``
          );
        } else {
          message.channel.sendCustom(
            `Deployment successful:\n\`\`\`${response}\`\`\``
          );
          // Terminate the bot after deployment
          process.exit(0);
        }
      });
    } catch (err) {
      this.client.console.error(err);
      message.channel.sendCustom(`An error occurred: \`${err.message}\``);
    }
  }
};
