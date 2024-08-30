const { SlashCommandBuilder } = require("@discordjs/builders");
const Logging = require("../../database/schemas/logging");
const { MessageEmbed } = require("discord.js");
const dmSystem = require("../../database/models/dmSystem");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("dmoptout")
        .setDescription("Opts out of the DM command"),
    async execute(interaction) {
        try {
            const client = interaction.client;
            const logging = await Logging.findOne({ guildId: interaction.guild.id });

            const dmsystem = await dmSystem.findOne({ userId: interaction.author.id });
            if (!dmsystem) {
                await new dmSystem({
                    userId: interaction.author.id,
                    optedout: true,
                });
                const dmoptout = new MessageEmbed()
                    .setDescription(`You have opted out of the DM system. To begin recieving DMs again, use /dmoptin.`);
                return interaction.reply({ embeds: [dmoptout] })
                    .then(async () => {
                        if (logging && logging.moderation.delete_reply === "true") {
                            setTimeout(() => {
                                interaction.deleteReply().catch(() => { interaction.channel.send({ content: "Error deleting message." }) });
                            }, 5000)
                        }
                    })
                    .catch(() => { interaction.channel.send({ content: "Error deleting message." }) });
            } else {
                await dmSystem.updateOne(
                    {
                        userId: message.author.id,
                    },
                    { $set: { optedout: true } }
                );
                const dmoptout = new MessageEmbed()
                    .setDescription(`You have opted out of the DM system. To begin recieving DMs again, use /dmoptin.`);
                return interaction.reply({ embeds: [dmoptout] })
                    .then(async () => {
                        if (logging && logging.moderation.delete_reply === "true") {
                            setTimeout(() => {
                                interaction.deleteReply().catch(() => { interaction.channel.send({ content: "Error deleting message." }) });
                            }, 5000)
                        }
                    })
                    .catch(() => { interaction.channel.send({ content: "Error deleting message." }) });
            }
        } catch (err) {
            console.error();
        }
    }
};