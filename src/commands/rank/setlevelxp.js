const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const Guild = require("../../database/models/leveling");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "setlevelxp",
      description: "Adds experience points to a user.",
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

    const guild = await Guild.findOne({ guildId: guildId });

    if (guild && !guild.levelingEnabled) {
      return message.reply("Leveling is disabled for this server.");
    }

    let user = await guild.users.find((u) => u.userId === targetUser.id);

    if (!user) {
      return message
        .reply("This user doesn't have a level profile!")
        .then((s) => {
          setTimeout(() => {
            s.delete();
          }, 5000);
        });
    }

    const actualLevelAmount = amount - 1;

    let nextLevelXP = actualLevelAmount * 50;
    let nextLevel = amount;
    let xpNeededForNextLevel = actualLevelAmount * nextLevelXP;

    if (!(amount >= 1000)) {
      user.xp = actualLevelAmount * nextLevelXP;
      user.level = amount;
      nextLevelXP = nextLevel * 50;
      xpNeededForNextLevel = nextLevel * nextLevelXP;
    } else {
      const embed = new MessageEmbed().setDescription(
        "This is above the max amount of leveld you can add to a user. Please input a number below 999",
      );
      return message.channel.sendCustom({ embeds: [embed] });
    }

    const levelbed = new MessageEmbed()
      .setColor("#3498db")
      .setTitle("Level Change")
      .setAuthor(targetUser.username, targetUser.displayAvatarURL())
      .setDescription(`Your level has been set to ${amount}.`)
      .setFooter(
        `XP: ${user.xp}/${xpNeededForNextLevel}`,
      );
    message.channel.sendCustom({
      embeds: [levelbed],
    });

    await guild.save();

    message.channel.send(`Set ${targetUser.username}'s level to ${amount}.`);
  }
};
