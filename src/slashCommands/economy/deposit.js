const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Profile = require("../../database/models/economy/profile");
const { createProfile } = require("../../utils/utils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("deposit")
        .setDescription("Deposit a number of money to the bank.")
        .addStringOption((option) => option.setName("amount").setDescription("The amount to deposit.").setRequired(true)),
    async execute(interaction) {
        const profile = await Profile.findOne({ userID: interaction.user.id, guildId: interaction.guild.id });
        if (!profile) {
            await createProfile(interaction.user, interaction.guild);
            await interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor("BLURPLE")
                        .setDescription(`Creating profile.\nUse this command again.`)
                ],
                ephemeral: true
            });
        } else {
            const amount = interaction.options.getString("amount");
            if (amount === "all") {
                await Profile.updateOne({
                    userID: interaction.user.id, guildId: interaction.guild.id
                }, { $inc: { wallet: -profile.wallet, bank: profile.wallet } })
                await interaction.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor("BLURPLE")
                            .setDescription(`Deposited $${profile.wallet} to your bank.`)
                    ]
                });
            } else if (amount > profile.wallet) {
                await interaction.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor("BLURPLE")
                            .setDescription(`You don't have enough money to deposit!`)
                    ],
                    ephemeral: true
                });
            } else {
                await Profile.updateOne({
                    userID: interaction.user.id, guildId: interaction.guild.id
                },
                    { $inc: { wallet: -amount, bank: amount } });
                await interaction.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor("BLURPLE")
                            .setDescription(`Deposited $${amount} to your bank.`)
                    ]
                });
            }
        }
    }
}