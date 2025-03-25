const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const { exec } = require("child_process");
const Logging = require("../../database/schemas/logging.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "clearbackups",
      description: "Clears all backups on the bot.",
    });
  }
  async run(message) {
    const logging = await Logging.findOne({ guildId: message.guild.id });
    if (
      !message.client.config.owner.includes(message.author.id) &&
      !message.client.config.developers.includes(message.author.id)
    ) {
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor(message.client.color.red)
            .setDescription(
              `${message.client.emoji.fail} | This command is for the owner.`
            ),
        ],
      });
    }

    let msg = await message.channel.sendCustom({
      content: "Clearing .env backups...",
    });

    exec("neonova clearbackups", (error, stdout, stderr) => {
      if (error) {
        console.error(`Backup removal error: ${error.message}`);
        return msg.edit({
          content: `Backups could not be cleared due to the following error:\n\`\`\`${
            stderr || error.message
          }\`\`\``,
        });
      }

      console.log(`Backups Cleared with these logs:\n${stdout}`);
      msg.edit({ content: `Backups Cleared.` }).then(async (s) => {
        setTimeout(() => {
          s.delete().catch(() => {});
        }, 3000)
      });

      if (logging && logging.moderation.delete_after_executed === "true") {
        message.delete().catch(() => {});
      }
    });
  }
};
