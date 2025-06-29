const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const { exec } = require("child_process");
const Logging = require("../../database/schemas/logging.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "createbackup",
      description: "Creates a backup of the .env file on Neonova.",
      category: "Owner",
    });
  }

  async run(message) {
    const logging = await Logging.findOne({ guildId: message.guild.id });
    if (!message.client.config.owner.includes(message.author.id)) {
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor(message.client.color.red)
            .setDescription(
              `${message.client.emoji.fail} | You are not the owner of this bot.`
            ),
        ],
      });
    }

    let msg = await message.channel.sendCustom({
      content: "Clearing .env backups...",
    });

    exec("neonova createbackup", (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to create backup: ${error.message}`);
        return msg.edit({
          content: `Backup could not be created due to the following error:\n\`\`\`${
            stderr || error.message
          }\`\`\``,
        });
      }

      console.log(`Backup created with these logs:\n${stdout}`);
      msg.edit({ content: `Backup created.` }).then(async (s) => {
        setTimeout(() => {
          s.delete().catch(() => {});
        }, 3000);
      });

      if (logging && logging.moderation.delete_after_executed === "true") {
        message.delete().catch(() => {});
      }
    });
  }
};
