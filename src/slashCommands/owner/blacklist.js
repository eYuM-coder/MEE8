const { SlashCommandBuilder } = require("@discordjs/builders");
const { WebhookClient, MessageEmbed } = require("discord.js");
const config = require("../../../config.json");
const webhookClient = new WebhookClient({
  url: config.webhooks.blacklist,
});
const Blacklist = require("../../database/schemas/blacklist");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("blacklist")
    .setDescription("Adds a user or guild to the blacklist.")
    .addStringOption((option) =>
      option
        .setName("target")
        .setDescription("The target type (user or guild).")
        .setRequired(true)
        .addChoices(
          { name: "user", value: "user" },
          { name: "guild", value: "guild" }
        )
    )
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to blacklist (only for user type).")
    )
    .addStringOption((option) =>
      option
        .setName("guild")
        .setDescription("The guild to blacklist (only for guild type).")
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for blacklisting.")
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.client.config.owner.includes(interaction.user.id)) {
      return interaction.reply("You are not the owner of this bot.");
    }

    const targetType = interaction.options.getString("target");
    const reason = interaction.options.getString("reason") || "Not Specified";
    let member, guild;

    if (targetType === "user") {
      member = interaction.options.getUser("user");

      if (!member) {
        return interaction.reply("Please provide a valid user.");
      }

      // Add the user to the blacklist
      await Blacklist.findOneAndUpdate(
        { discordId: member.id },
        {
          type: "user",
          isBlacklisted: true,
          reason,
          length: null,
        },
        { upsert: true }
      );

      // Send a confirmation message
      await interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor("BLURPLE")
            .setTitle("User added to the blacklist!")
            .setDescription(`${member.tag} - \`${reason}\``),
        ],
      });

      // Send to webhook
      const embed = new MessageEmbed()
        .setColor("BLURPLE")
        .setTitle("Blacklist Report")
        .addFields(
          { name: "Status", value: "Added to the blacklist." },
          { name: "User", value: `${member.tag} (${member.id})` },
          {
            name: "Responsible",
            value: `${interaction.user.tag} (${interaction.user.id})`,
          },
          { name: "Reason", value: reason }
        );

      return webhookClient.send({
        username: "Neonova",
        avatarURL: "https://neonova.eyum.org/logo.png",
        embeds: [embed],
      });
    }

    if (targetType === "guild") {
      guild = interaction.options.getString("guild");

      if (!guild) {
        return interaction.reply("Please provide a valid guild.");
      }

      // Add the guild to the blacklist
      await Blacklist.findOneAndUpdate(
        { guildId: guild },
        {
          type: "guild",
          isBlacklisted: true,
          reason,
          length: null,
        },
        { upsert: true }
      );

      // Send a confirmation message
      await interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor("BLURPLE")
            .setTitle("Server added to the blacklist!")
            .setDescription(`${guild} - \`${reason}\``),
        ],
      });

      // Send to webhook
      const embed = new MessageEmbed()
        .setColor("BLURPLE")
        .setTitle("Blacklist Report")
        .addFields(
          { name: "Status", value: "Added to the blacklist." },
          { name: "Server", value: `${guild}` },
          {
            name: "Responsible",
            value: `${interaction.user.tag} (${interaction.user.id})`,
          },
          { name: "Reason", value: reason }
        );

      return webhookClient.send({
        username: `${config.botName} Blacklists`,
        avatarURL: "https://neonova.eyum.org/logo.png",
        embeds: [embed],
      });
    }
  },
};
