const { SlashCommandBuilder } = require("@discordjs/builders");
const Logging = require("../../database/schemas/logging");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("yeet")
    .setDescription('"Bans" every user in a guild'),
  async execute(interaction) {
    try {
      const logging = await Logging.findOne({ guildId: interaction.guild.id });

      if (!interaction.member.permissions.has("BAN_MEMBERS")) {
        return interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
      }

      const members = interaction.guild.members.cache.size;

      const embed = new MessageEmbed()
        .setDescription("Are you sure?")
        .setColor("#FF0000");
      await interaction.reply({ embeds: [embed] });

      const filter = (m) => m.author.id === interaction.user.id;
      const collector = interaction.channel.createMessageCollector({
        filter,
        time: 60000,
      });

      collector.on("collect", async (m) => {
        const firstInput = m.content;

        if (firstInput.toLowerCase() === "yes") {
          const embed = new MessageEmbed()
            .setDescription("SO YOU WANT ME TO BAN THEM, CORRECT?")
            .setColor("#FF0000");
          await interaction.channel.send({ embeds: [embed] });
        } else {
          collector.stop();
          return interaction.channel.send({
            content: "Canceling interaction.",
          });
        }

        collector.stop();

        const secondCollector = interaction.channel.createMessageCollector({
          filter,
          time: 60000,
        });

        secondCollector.on("collect", async (m) => {
          const secondInput = m.content;

          let message;

          if (secondInput.toLowerCase() === "yes") {
            const embed = new MessageEmbed()
              .setDescription(
                `Banning ${members} ${members === 1 ? "member" : "members"}... (0%)`,
              )
              .setColor("#FF0000");
            message = await interaction.channel.send({ embeds: [embed] });
            setTimeout(async () => {
              embed
                .setDescription(
                  `Banning ${members} ${members === 1 ? "member" : "members"}... (28%)`,
                )
                .setColor("#FF0000");
              await message.edit({ embeds: [embed] });
            }, 5000);

            setTimeout(async () => {
              embed
                .setDescription(
                  `Banning ${members} ${members === 1 ? "member" : "members"}... (59%)`,
                )
                .setColor("#FF0000");
              await message.edit({ embeds: [embed] });
            }, 10000);
            setTimeout(async () => {
              embed
                .setDescription(
                  `Banning ${members} ${members === 1 ? "member" : "members"}... (82%)`,
                )
                .setColor("#FF0000");
              await message.edit({ embeds: [embed] });
            }, 15000);
            setTimeout(async () => {
              embed
                .setDescription(
                  `Banning ${members} ${members === 1 ? "member" : "members"}... (99%)`,
                )
                .setColor("#FF0000");
              await message.edit({ embeds: [embed] });
            }, 20000);

            setTimeout(async () => {
              await interaction.channel.send({ content: "Nah." });
            }, 40000);
          } else {
            secondCollector.stop();
            return interaction.channel.send({
              content: "Canceling interaction.",
            });
          }
          secondCollector.stop();
        });
        secondCollector.on("end", (collected, reason) => {
          if (reason == "time") {
            return interaction.channel.send({
              content: "You took too long to provide an answer.",
            });
          }
        });

        collector.on("end", (collected, reason) => {
          if (reason == "time") {
            return interaction.channel.send({
              content: "You took too long to provide an answer.",
            });
          }
        });
      });
    } catch (err) {
      console.log(err);
    }
  },
};
