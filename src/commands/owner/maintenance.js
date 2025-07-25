const Command = require("../../structures/Command");
const Maintenance = require("../../database/schemas/maintenance");
const { MessageEmbed } = require("discord.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "maintenancemode",
      aliases: ["maintenance"],
      description: "Sets the bot to maintenance",
      category: "Owner",
    });
  }

  async run(message, args) {
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
    if (!args[0])
      return message.channel.sendCustom(
        "Would you like to enable or disable maintenance mode?"
      );

    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (args[0].toLowerCase() == "enable") {
      if (maintenance) {
        maintenance.toggle = "true";
        await maintenance.save();
      } else {
        const newMain = new Maintenance({
          toggle: "true",
        });
        newMain.save().catch(() => {});
      }
      message.channel.sendCustom("Enabled maintenance mode");
    } else if (args[0].toLowerCase() == "disable") {
      if (maintenance) {
        maintenance.toggle = "false";
        await maintenance.save();
      } else {
        const newMain = new Maintenance({
          toggle: "false",
        });
        newMain.save().catch(() => {});
      }
      message.channel.sendCustom("Disabled maintenance Mode");
    } else {
      message.channel.sendCustom("Invalid Response");
    }
  }
};
