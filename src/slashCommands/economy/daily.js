const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Profile = require("../../database/models/economy/profile");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Collect daily earnings. 24hr cooldown.")
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    const profile = await Profile.findOne({
      userID: interaction.user.id,
    });
    if (!profile) {
      await interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.yellow)
            .setDescription(
              `You currently do not have a profile registered!\nUse the /register command to register your profile.`
            ),
        ],
        ephemeral: true,
      });
    } else {
      if (!profile.lastDaily) {
        await Profile.updateOne(
          {
            userID: interaction.user.id,
          },
          { $set: { lastDaily: Date.now() } }
        );
        await Profile.updateOne({
          userID: interaction.user.id,
        });
        await interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(interaction.client.color.green)
              .setTitle(`${interaction.user.username}'s Daily`)
              .setDescription(
                `You have collected todays earnings ($50000).\nCome back tomorrow to collect more.`
              ),
          ],
        });
      } else if (Date.now() - profile.lastDaily > 86400000) {
        await Profile.updateOne(
          { userID: interaction.user.id },
          { $set: { lastDaily: Date.now() } }
        );
        await Profile.updateOne(
          { userID: interaction.user.id },
          { $inc: { wallet: 50000 } }
        );
        await interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(interaction.client.color.green)
              .setTitle(`${interaction.user.username}'s Daily`)
              .setDescription(
                `You have collected your daily earnings of $50000.`
              ),
          ],
          ephemeral: true,
        });
      } else {
        const lastDaily = new Date(profile.lastDaily);
        const timeLeft = Math.round(
          (lastDaily.getTime() + 86400000 - Date.now()) / 1000
        );
        const hours = Math.floor(timeLeft / 3600);
        const minutes = Math.floor((timeLeft - hours * 3600) / 60);
        const seconds = timeLeft - hours * 3600 - minutes * 60;
        await interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(interaction.client.color.red)
              .setTitle(`${interaction.user.username}'s Daily cooldown`)
              .setDescription(
                `You have to wait ${hours}h ${minutes}m ${seconds}s before you can collect your daily earnings!`
              ),
          ],
          ephemeral: true,
        });
      }
    }
  },
};
