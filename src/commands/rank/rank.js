const Command = require("../../structures/Command");
const { createCanvas, loadImage } = require("canvas");
const { MessageAttachment } = require("discord.js");
const Guild = require("../../database/models/leveling");

// Calculate the required XP for a certain level
function calculateRequiredXP(level) {
  const baseXP = 50;
  const increment = level * 50;
  const xpNeeded = level * increment;
  if (level === 0) {
    return baseXP + xpNeeded;
  } else {
    return xpNeeded;
  }
}

function abbreviateNumber(number) {
  return number >= 1e12 ? `${(number / 1e12).toFixed(2)}T` : number >= 1e9 ? `${(number / 1e9).toFixed(2)}B` : number >= 1e6 ? `${(number / 1e6).toFixed(2)}M` : number >= 1e3 ? `${(number / 1e3).toFixed(2)}K` : number.toString();
}


module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "rank",
      description: "Display your rank card.",
      aliases: ["level"],
      category: "Leveling",
      cooldown: 5,
      guildOnly: true,
    });
  }

  async run(message) {
    try {
      const targetUser = message.mentions.users.first() || message.author;
      const guildId = message.guild.id;
      const guild = await Guild.findOne({ guildId: guildId });

      if (!guild) {
        return message.reply("Guild data not found in database.");
      }

      if (
        guild &&
        guild.levelingEnabled === false
      ) {
        return message.reply("Leveling is disabled for this server.");
      }

      const user = guild.users.find((u) => u.userId === targetUser.id);

      if (!user) {
        return message.reply("This user doesn't have any levels or XP.");
      }

      const canvas = createCanvas(900, 300);
      const ctx = canvas.getContext("2d");

      // Load background (Replace 'default_background_url.jpg' with your default background URL)
      const backgroundURL =
        user.background ||
        "https://img.freepik.com/premium-photo/abstract-blue-black-gradient-plain-studio-background_570543-8893.jpg";
      const background = await loadImage(backgroundURL);
      const sortedUsers = guild.users.sort((a, b) => b.xp - a.xp);

      const userRank = sortedUsers.findIndex((u) => u.userId === targetUser.id) + 1;
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

      // Draw user details
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 36px Arial";
      ctx.textAlign = "left";
      ctx.fillText(targetUser.username, 200, 100);

      // Avatar
      const avatar = await loadImage(
        targetUser.displayAvatarURL({ format: "png", size: 128 }),
      );
      ctx.drawImage(avatar, 50, 50, 140, 150);

      ctx.font = "bold 48px Arial";
      const levelText = `Level ${user.level}`;
      ctx.fillText(levelText, 670, 100);

      const requiredXPForCurrentLevel = calculateRequiredXP(user.level - 1);
      const requiredXPForNextLevel = calculateRequiredXP(user.level);
      const progressBarWidth = 600;
      const progressWidth =
        ((user.xp - requiredXPForCurrentLevel) /
          (requiredXPForNextLevel - requiredXPForCurrentLevel)) *
        progressBarWidth;

      // XP details
      ctx.font = "24px Arial";
      ctx.fillText(`Current XP: ${user.xp}`, 200, 150);
      ctx.fillText(
        `XP till Level Up: ${requiredXPForNextLevel - user.xp}`,
        200,
        200,
      );

      ctx.font = "24px Arial";
      ctx.fillText(`Level: ${user.level}    Total XP: ${abbreviateNumber(user.xp)}/${abbreviateNumber(requiredXPForNextLevel)}    Rank: ${userRank}`, 100, 250);

      // Rounded progress bar
      ctx.roundRect = function (x, y, width, height, radius, fill, stroke) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(
          x + width,
          y + height,
          x + width - radius,
          y + height,
        );
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
        stroke && this.stroke();
        fill && this.fill();
      };

      ctx.save();
      ctx.roundRect(100, 250, progressWidth, 15, 7, true, false);

      const attachment = new MessageAttachment(canvas.toBuffer(), "rank.png");
      message.channel.send({ files: [attachment] });
    } catch (error) {
      console.error("Error occurred:", error);
      message.reply("An error occurred while generating the rank card.");
    }
  }
};
