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
    .setName("balance")
    .setDescription("Check your balance or the balance of another user")
    .addUserOption((option) =>
      option.setName("member").setDescription("The optional member to check")
    )
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    const user = interaction.options.getUser("member") || interaction.user;

    const profile = await Profile.findOne({
      userID: user.id,
    });
    if (!profile) {
      if (user.id !== interaction.user.id)
        return interaction.reply({
          content: `${user} does not have a profile registered! They can use the /register command to register their profile.`,
          ephemeral: true,
        });

      await interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.green)
            .setDescription(
              `You currently do not have a profile registered!\nUse the /register command to register your profile.`
            ),
        ],
        ephemeral: true,
      });
    } else {
      const bankCapacityPercentage = profile.hasInfiniteStorage ? "∞" :
        ((profile.bank / profile.bankCapacity) * 100).toFixed(2).concat("%");
        const walletAmount = abbreviateNumber(profile.wallet);
        const bankAmount = abbreviateNumber(profile.bank);
        const bankCapacityAmount = profile.hasInfiniteStorage ? "∞" : abbreviateNumber(profile.bankCapacity);
      await interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor("BLURPLE")
            .setTitle(`${user.username}'s Balance`)
            .setDescription(
              `**Wallet:** $${walletAmount}\n**Bank:** $${bankAmount}/$${bankCapacityAmount} (${bankCapacityPercentage})`
            ),
        ],
      });
    }
  },
};
