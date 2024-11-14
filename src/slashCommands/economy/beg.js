const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Profile = require("../../database/models/economy/profile");
const { createProfile } = require("../../utils/utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("beg")
    .setDescription("Beg for money"),
  async execute(interaction) {
    const amount = Math.floor(Math.random() * 2000);
    const profile = await Profile.findOne({ userID: interaction.user.id, guildId: interaction.guild.id });
    if (!profile) {
      await createProfile(interaction.user, interaction.guild);
      await interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor("BLURPLE")
            .setDescription(`Creatiing profile.\nUse this command again to beg for money.`)
        ],
        ephemeral: true
      });
    } else {
      if (!profile.lastBeg) {
        await Profile.updateOne(
          {
            userID: interaction.user.id,
            guildId: interaction.guild.id
          },
          { $set: { lastBeg: Date.now() } }
        );
        await Profile.updateOne({ userID: interaction.user.id, guildId: interaction.guild.id }, { $inc: { wallet: amount } });
        await interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor("BLURPLE")
              .setTitle(`${interaction.user.username}'s Beg`)
              .setDescription(`You have beggedd ($${amount}).\nCome back in 3 minutes to beg again.`)
          ]
        });
      } else if (Date.now() - profile.lastBeg > 180000) {
        await Profile.updateOne({
          userID: interaction.user.id, guildId: interaction.guild.id
        }, { $set: { lastBeg: Date.now() } });
        await Profile.updateOne({ userID: interaction.user.id, guildId: interaction.guild.id }, { $inc: { wallet: amount } });
        await interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor("BLURPLE")
              .setTitle(`${interaction.user.username}'s Beg`)
              .setDescription(`You begged for a total of $${amount}.`)
          ]
        });
      } else {
        const lastBeg = new Date(profile.lastBeg);
        const timeLeft = Math.round((lastBeg.getTime() + 180000 - Date.now()) / 1000);
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft - minutes * 60;
        await interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor("BLURPLE")
              .setTitle(`${interaction.user.username}'s Beg cooldown`)
              .setDescription(`You have to wait ${minutes}m ${seconds}s before you can beg again!`)
          ],
          ephemeral: true
        });
      }
    }
  }
};