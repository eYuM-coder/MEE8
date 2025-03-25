const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaveguild")
    .setDescription("Make the bot leave a guild")
    .addStringOption((option) =>
      option.setName("guild").setDescription("The guild ID").setRequired(true)
    )
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    const guildId = interaction.options.getString("guild");
    const guild = interaction.client.guilds.cache.get(guildId);
    if (!guild)
      return interaction.reply({
        content: `Invalid Guild ID`,
        ephemeral: true,
      });

    await interaction.deferReply({ ephemeral: true });

    if (
      !interaction.client.config.owner.includes(interaction.user.id) &&
      interaction.client.config.developers.includes(interaction.user.id)
    ) {
      return interaction.editReply({
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

    await guild.leave();
    const embed = new MessageEmbed()
      .setTitle("Leave Guild")
      .setDescription(`I have successfully left **${guild.name}**.`)
      .setFooter({
        text: interaction.member.displayName,
        iconURL: interaction.member.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp()
      .setColor(interaction.guild.members.me.displayHexColor);
    interaction.editReply({ embeds: [embed], ephemeral: true });
  },
};
