const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Profile = require("../../database/models/economy/profile.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("monthly")
    .setDescription("Collect your monthly coins. 30d cooldown.")
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
      });
    } else {
      if (!profile.lastMonthly) {
        await Profile.updateOne(
          { userID: interaction.user.id },
          { $set: { lastMonthly: Date.now() } }
        );
        await Profile.updateOne(
          { userID: interaction.user.id },
          { $inc: { wallet: 2500000 } }
        );
        await interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(interaction.client.color.green)
              .setTitle(`${interaction.user.username}'s Monthly earnings`)
              .setDescription(
                `You have collected this month's earnings ($2,500,000).\nCome back next month to collect more.`
              ),
          ],
        });
      } else if (Date.now() - profile.lastMonthly > 2592000000) {
        await Profile.updateOne(
          { userID: interaction.user.id },
          { $set: { lastMonthly: Date.now() } }
        );
        await Profile.updateOne(
          { userID: interaction.user.id },
          { $inc: { wallet: 2500000 } }
        );
        await interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(interaction.client.color.green)
              .setTitle(`${interaction.user.username}'s Monthly income`)
              .setDescription(
                `You have collected your monthly earnings on $2,500,000.\nCome back next month to collect more.`
              ),
          ],
        });
      } else {
        {
          const lastMonthly = new Date(profile.lastMonthly);
          const timeLeft = Math.round(
            (lastMonthly.getTime() + 2592000000 - Date.now()) / 1000
          );
          const days = Math.floor(timeLeft / 86400);
          const hours = Math.floor((timeLeft - days * 86400) / 3600);
          const minutes = Math.floor(
            (timeLeft - days * 86400 - hours * 3600) / 60
          );
          const seconds = timeLeft - days * 86400 - hours * 3600 - minutes * 60;
          await interaction.reply({
            embeds: [
              new MessageEmbed()
                .setColor(interaction.client.color.red)
                .setTitle(
                  `${interaction.user.username}'s Monthly income cooldown`
                )
                .setDescription(
                  `You have to wait ${days}d ${hours}h ${minutes}m ${seconds}s before you can collect your monthly income again.`
                ),
            ],
          });
        }
      }
    }
  },
};
