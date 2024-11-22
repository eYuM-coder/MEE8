const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Profile = require("../../database/models/economy/profile");
const { createProfile } = require("../../utils/utils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("balance")
        .setDescription("Check your balance or the balance of another user")
        .addUserOption((option) => option.setName("member").setDescription("The optional member to check"))
        .setContexts(0)
        .setIntegrationTypes(0),
    async execute(interaction) {
        const user = interaction.options.getMember("member") || interaction.user;

        const profile = await Profile.findOne({
            userID: user.id,
            guildId: interaction.guild.id
        });
        if (!profile) {
            if (user.id !== interaction.user.id) return interaction.reply({ content: `${user} does not have a profile!`, ephemeral: true });

            await createProfile(user, interaction.guild);
            await interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor("BLURPLE")
                        .setDescription(`Creating profile.\nUse this command again to check your balance.`)
                ], ephemeral: true
            });
        } else {
            await interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setColor("BLURPLE")
                        .setTitle(`${user.username}'s Balance`)
                        .setDescription(`**Wallet:** $${profile.wallet}\n**Bank:** $${profile.bank}`)
                ]
            });
        }
    }
};