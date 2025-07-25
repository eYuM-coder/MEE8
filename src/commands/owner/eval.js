const { MessageEmbed } = require("discord.js");
const Command = require("../../structures/Command");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "eval",
      aliases: ["ev"],
      description: "This is for the developers.",
      category: "Owner",
      usage: ["<thing-to-eval>"],
    });
  }

  async run(message, args) {
    if (
      !message.client.config.owner.includes(message.author.id) &&
      !message.client.config.developers.includes(message.author.id)
    ) {
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor(message.client.color.red)
            .setDescription(
              `${message.client.emoji.fail} | You are not the owner or a developer of this bot.`
            ),
        ],
      });
    }
    const input = args.join(" ");
    if (!input) return message.channel.sendCustom(`What do I evaluate?`);
    if (!input.toLowerCase().includes("token")) {
      let embed = ``;

      try {
        let output = eval(input);
        if (typeof output !== "string")
          output = require("util").inspect(output, { depth: 0 });

        embed = `\`\`\`js\n${
          output.length > 1024 ? "Too large to display." : output
        }\`\`\``;
      } catch (err) {
        embed = `\`\`\`js\n${
          err.length > 1024 ? "Too large to display." : err
        }\`\`\``;
      }

      message.channel.sendCustom(embed);
    } else {
      message.channel.sendCustom("Bruh you tryina steal my token huh?");
    }
  }
};
