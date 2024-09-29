const Command = require("../../structures/Command");
const Discord = require("discord.js");
const Guild = require("../../database/models/leveling");
module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "leaderboard",
      description: "Display the server's leaderboard based on levels.",
      category: "Leveling",
      cooldown: 5,
      guildOnly: true,
    });
  }

  async run(message) {
    try {
      const guildId = message.guild.id;
      const guild = await Guild.findOne({ guildId: guildId });

      if (!guild) {
        return message.reply("No leveling data found for this server.");
      }

      if (guild.levelingEnabled === false) {
        return message.reply("Leveling is disabled for this server.");
      }
      
      const users = guild.users;
      const sortedUsers = users.sort((a, b) => b.level - a.level || b.xp - a.xp).slice(0, 10);

      const leaderboardEmbed = new Discord.MessageEmbed()
        .setColor("#0099ff")
        .setTitle("Server Leaderboard")
        .setDescription("Top 10 Users based on Levels:")
        .setFooter("Levels are calculated based on XP.");
      for (let i = 0; i < sortedUsers.length; i++) {
        const user = sortedUsers[i];
        let member;

        try {
          member = await message.guild.members.fetch(user.userId); // Get the member from the cache
        } catch (error) {
          console.error("Error fetching member:", error);
        }

        leaderboardEmbed.addField(
          `#${i + 1} - ${member ? `${member.user.username}` : "Unknown"}`,
          `Level: ${user.level} | XP: ${user.xp}`,
        );
      }

      message.channel.send({ embeds: [leaderboardEmbed] });
    } catch (error) {
      console.error("Error occurred:", error);
      message.reply("An error occurred while fetching the leaderboard.");
    }
  }
};
