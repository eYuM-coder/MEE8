const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const moment = require("moment");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("server")
    .setDescription("Information of a server")
    .addStringOption((option) =>
      option.setName("guild").setDescription("The guild ID").setRequired(true)
    )
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    function checkDays(date) {
      let now = new Date();
      let diff = now.getTime() - date.getTime();
      let days = Math.floor(diff / 86400000);
      return days + (days == 1 ? " day" : " days") + " ago";
    }
    const client = interaction.client;
    const guildId = interaction.options.getString("guild");
    const guild = interaction.client.guilds.cache.get(guildId);
    if (!guild) return interaction.reply({ content: `Invalid guild ID` });

    if (
      !interaction.client.config.owner.includes(interaction.user.id) &&
      !interaction.client.config.developers.includes(interaction.user.id)
    ) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(
              `${interaction.client.emoji.fail} | This command is for the owner.`
            ),
        ],
        ephemeral: true,
      });
    }

    const embed = new MessageEmbed()
      .setAuthor({ name: guild.name, iconURL: guild.iconURL() })
      .addFields(
        { name: "Server ID", value: `${guild.id}`, inline: true },
        {
          name: "Total | Humans | Bots",
          value: `${guild.members.cache.size} | ${
            guild.members.cache.filter((member) => !member.user.bot).size
          } | ${guild.members.cache.filter((member) => member.user.bot).size}`,
          inline: true,
        },
        {
          name: "Verification Level",
          value: `${guild.verificationLevel}`,
          inline: true,
        },
        {
          name: "Channels",
          value: `${guild.channels.cache.size}`,
          inline: true,
        },
        { name: "Roles", value: `${guild.roles.cache.size}`, inline: true },
        {
          name: "Creation Date",
          value: `${guild.createdAt.toUTCString().substr(0, 16)} (${checkDays(
            guild.createdAt
          )})`,
          inline: true,
        }
      )
      .setThumbnail(guild.iconURL())
      .setColor(interaction.guild.members.me.displayHexColor);
    interaction.reply({ embeds: [embed] }).catch((error) => {
      interaction.reply({ content: `Error: ${error}` });
    });
  },
};
