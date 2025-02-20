const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fetchinvite")
    .setDescription("Fetch an invite!")
    .addStringOption((option) =>
      option.setName("guild").setDescription("The guild ID").setRequired(true)
    )
    .setContexts(0)
    .setIntegrationTypes(0),
  async execute(interaction) {
    const guildId = interaction.options.getString("guild");
    const guild = interaction.client.guilds.cache.get(guildId);

    if (!guild) return interaction.reply({ content: `Invalid Guild ID` });

    if (
      !interaction.client.config.owner.includes(interaction.user.id) &&
      !interaction.client.config.developers.includes(interaction.user.id)
    ) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(
              `${interaction.client.emoji.fail} | You are not a developer or the owner of this bot.`
            ),
        ],
        ephemeral: true,
      });
    }

    var textChats = guild.channels.cache.find(
      (ch) =>
        ch.type === "GUILD_TEXT" &&
        ch.permissionsFor(guild.me).has("CREATE_INSTANT_INVITE")
    );

    if (!textChats) return interaction.reply({ content: `No channel` });

    await textChats
      .createInvite({
        maxAge: 0,
        maxUses: 0,
      })
      .then((inv) => {
        console.log(`${guild.name} | ${inv.url}`);
        interaction.reply({ content: `${guild.name} | ${inv.url}` });
      })
      .catch(() => {
        interaction.reply({
          content: "I do not have permission to do that!",
          ephemeral: true,
        });
      });
  },
};
