const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Profile = require("../../database/models/economy/profile");
const { createProfile } = require("../../utils/utils");
const { execute } = require("./beg");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Collect daily earnings. 24hr cooldown."),
  async execute(interaction) {
    const profile = await Profile.findOne({ guildId: interaction.guild.id, userID: interaction.user.id });
    if (!profile) {
      await createProfile(interaction.user, interaction.guild);
      await interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor("BLURPLE")
            .setDescription(`Creating profile.\nUse this command again to collect your daily earnings!`)
        ],
        ephemeral: true
      });
    } else {
      if (!profile.lastDaily) {
        await Profile.updateOne(
          {
            userID: interaction.user.id, guildId: interaction.guild.id
          },
          { $set: { lastDaily: Date.now() } }
        );
        await Profile.updateOne({ userID: interaction.user.id, guildId: interaction.guild.id })
        await interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor("BLURPLE")
              .setTitle(`${interaction.user.username}'s Daily`)
              .setDescription(`You have collected todays earnings ($50000).\nCome back tomorrow to collect more.`)
          ]
        });
      } else if (Date.now() - profile.lastDaily > 86400000) {
        await Profile.updateOne(
          { userID: interaction.user.id, guildId: interaction.guild.id },
          { $set: { lastDaily: Date.now() } }
        );
        await Profile.updateOne({ userID: interaction.user.id, guildId: interaction.guild.id }, { $inc: { wallet: 50000 } });
        await interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor("BLURPLE")
              .setTitle(`${interaction.user.username}'s Daily`)
              .setDescription(`You have collected your daily earnings of $50000.`)
          ],
          ephemeral: true
        });
      } else {
        const lastDaily = new Date(profile.lastDaily);
        const timeLeft = Math.round((lastDaily.getTime() + 86400000 - Date.now()) / 1000);
        const hours = Math.floor(timeLeft / 3600);
        const minutes = Math.floor((timeLeft - hours * 3600) / 60);
        const seconds = timeLeft - hours * 3600 - minutes * 60;
        await interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor("BLURPLE")
              .setTitle(`${interaction.user.username}'s Daily cooldown`)
              .setDescription(`You have to wait ${hours}h ${minutes}m ${seconds}s before you can collect your daily earnings!`)
          ],
          ephemeral: true
        });
      }
    }
  }
};