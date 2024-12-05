// AddXPCommand.js
const Command = require("../../structures/Command");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const Guild = require("../../database/models/leveling");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "removexp",
      description: "Removes experience points from a user.",
      category: "Leveling",
      cooldown: 3,
      userPermissions: ["MANAGE_MESSAGES"], // Require admin permissions
    });
  }

  async run(message, args) {
    const targetUser = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!targetUser || isNaN(amount) || amount <= 0) {
      return message.reply(
        "Please mention a user and provide a valid XP amount.",
      );
    }

    const guildId = message.guild.id;
    let guild = await Guild.findOne({ guildId: guildId });

    if (!guild) {
      return message
        .reply("This server does not have any leveling data.")
        .then((s) => {
          setTimeout(() => {
            s.delete();
          }, 5000);
        });
    }

    let user = guild.users.find((user) => user.userId === targetUser.id);

    if (!user) {
      return message
        .reply("This user doesn't have a level profile!")
        .then((s) => {
          setTimeout(() => {
            s.delete();
          }, 5000);
        });
    }

    let nextLevelXP = user.level * 50;
    let xpNeededForNextLevel = user.level * nextLevelXP;

    if (!(amount >= 1000000000)) {
      user.xp -= amount;
    } else {
      const embed = new MessageEmbed().setDescription(
        "This is above the max amount of XP you can add. Please input a number below 999,999,999",
      );
      return message.channel.sendCustom({ embeds: [embed] });
    }
    const previousLevel = user.level;
    while (xpNeededForNextLevel >= user.xp) {
      user.level -= 1;
      nextLevelXP = user.level * 75;
      xpNeededForNextLevel = user.level * nextLevelXP;
    }
    const levelbed = new MessageEmbed()
      .setColor("#3498db")
      .setTitle("Level Up!")
      .setAuthor(targetUser.username, targetUser.displayAvatarURL())
      .setDescription(
        `Unbelievable! You lost ${previousLevel - user.level} ${previousLevel - user.level == 1 ? "level!" : "levels!"}`,
      )
      .setFooter(`XP: ${user.xp}/${xpNeededForNextLevel}`);

    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId("levelup")
        .setLabel("Level Up")
        .setStyle("SUCCESS"),
    );
    if (previousLevel - user.level >= 1) {
      message.channel.sendCustom({
        embeds: [levelbed],
        components: [row],
      });
    }

    message.channel.send(`Removed ${amount} XP from ${targetUser.username}.`);

    await guild.save();
  }
};
