const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Profile = require("../../database/models/economy/profile");
const { createProfile } = require("../../utils/utils.js");
const { execute } = require("../fun/dm.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addmoney")
    .setDescription("Add money to a users wallet.")
    .addUserOption((option) =>
      option.setName("member").setDescription("The member").setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("The amount to add")
        .setRequired(true)
    )
    .setContexts(0)
    .setIntegrationTypes(0),
  async execute(interaction) {
    const user = interaction.options.getMember("member");
    const amount = interaction.options.getInteger("amount");
    const profile = await Profile.findOne({
      userID: user.id,
      guildId: interaction.guild.id,
    });
    if (!profile) {
      await createProfile(user, interaction.guild);
      await interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor("BLURPLE")
            .setDescription(
              `Creating profile.\nUse this command again to use it.`
            ),
        ],
        ephemeral: true,
      });
    } else {
      await Profile.updateOne(
        {
          userID: user.id,
          guildId: interaction.guild.id,
        },
        { $inc: { wallet: amount } }
      );
      await interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor("BLURPLE")
            .setDescription(`Added $${amount} to ${user}`),
        ],
      });
    }
  },
};
