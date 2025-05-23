const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const Profile = require("../../database/models/economy/profile");
const { createProfile } = require("../../utils/utils");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            name: "register",
            description: "Register your profile in the economy system.",
            category: "Economy",
            cooldown: 5,
        });
    }

    async run(message) {
        const profile = await Profile.findOne({ userID: message.author.id });
        if (!profile) {
            await createProfile(message.author);
            await message.channel.sendCustom({
                embeds: [
                    new MessageEmbed()
                    .setColor(message.client.color.green)
                    .setDescription(`Your profile has been registered successfully!\nUse the /unregister command to remove your profile.`)
                ]
            })
        } else {
            return message.channel.sendCustom({
                embeds: [
                    new MessageEmbed()
                    .setColor(message.client.color.red)
                    .setDescription(`You already have a profile registered!\nUse the /unregister command to remove it.`)
                ]
            })
        }
    }
}