const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Profile = require("../../database/models/economy/profile");

function abbreviateNumber(number) {
  return number >= 1e12
    ? `${(number / 1e12).toFixed(2)}T`
    : number >= 1e9
    ? `${(number / 1e9).toFixed(2)}B`
    : number >= 1e6
    ? `${(number / 1e6).toFixed(2)}M`
    : number >= 1e3
    ? `${(number / 1e3).toFixed(2)}K`
    : number.toString();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rob")
    .setDescription("Rob someone!")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to rob.")
    )
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const profile = await Profile.findOne({ userID: interaction.user.id });
    if (!profile) {
      await interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(
              `You currently do not have a profile registered!\nUse the /register command to register your profile.`
            ),
        ],
      });
    } else {
      if (user.id == interaction.user.id) {
        await interaction.reply({
          embeds: [
            new MessageEmbed().setDescription(
              `hey stupid, seems pretty dumb to steal from urself`
            ),
          ],
        });
      } else if (!profile.lastRobbed) {
        await Profile.updateOne(
          { userID: interaction.user.id },
          { $set: { lastRobbed: Date.now() } }
        );
        let amount = Math.floor(Math.random() * profile.wallet);
        await Profile.updateOne(
          {
            userID: user.id,
          },
          { $inc: { wallet: -amount } }
        );
        await Profile.updateOne(
          {
            userID: interaction.user.id,
          },
          { $inc: { wallet: amount } }
        );

        await interaction.reply({
          embeds: [
            new MessageEmbed()
              .setDescription(
                `Successfully robbed ${user} for $${abbreviateNumber(amount)}.`
              )
              .setColor(interaction.client.color.green)
              .setTimestamp(),
          ],
        });
      } else if (Date.now - profile.lastRobbed > 600000) {
        await Profile.updateOne(
          { userID: interaction.user.id },
          { $set: { lastRobbed: Date.now() } }
        );
        let amount = Math.floor(Math.random() * profile.wallet);
        await Profile.updateOne(
          {
            userID: user.id,
          },
          { $inc: { wallet: -amount } }
        );
        await Profile.updateOne(
          {
            userID: interaction.user.id,
          },
          { $inc: { wallet: amount } }
        );

        await interaction.reply({
          embeds: [
            new MessageEmbed()
              .setDescription(
                `Successfully robbed ${user} for $${abbreviateNumber(amount)}.`
              )
              .setColor(interaction.client.color.green)
              .setTimestamp(),
          ],
        });
      } else {
        const lastRobbed = new Date(profile.lastRobbed);
        const timeLeft = Math.round(
          (lastRobbed.getTime() + 600000 - Date.now()) / 1000
        );
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft - minutes * 60;
        await interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(interaction.client.color.red)
              .setDescription(
                `You have to wait ${minutes}m ${seconds}s before you can rob someone!`
              ),
          ],
        });
      }
    }
  },
};
