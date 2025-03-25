const Command = require("../../structures/Command");
const { MessageEmbed, Message } = require("discord.js");
const crc32 = require("crc").crc32;
module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            name: "ship",
            description: "Ships two users together and calculates compatibility",
            category: "Fun",
            cooldown: 15,
        })
    }

    async run(message) {
        const mentions = message.mentions.members;

        if (mentions.length < 2) {
            return message.channel.send('Please provide two names to ship! Example: !ship Alice Bob');
        }

        const users = Array.from(mentions.values()).slice(0, 2);

        const combinedNames = users[0].username + users[1].username;

        const hash = crc32(combinedNames);

        const shipPercentage = Math.abs(hash % 101);

        const shipName = users[0].username.slice(0, Math.ceil(users[0].username.length / 2)) + users[1].username.slice(Math.floor(users[1].username.length / 2));
    
        message.channel.send({
            content: `:heartpulse: MATCHMAKING :heartpulse:\n:small_red_triangle_down: *\`${users[0].username}\`*\n:small_red_triangle_up: *\`${users[1].username}\`*`,
            embeds: [
                new MessageEmbed()
                .setDescription(`${users[0].username}`)
            ]
        })
    }
}