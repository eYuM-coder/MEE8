const { SlashCommandBuilder } = require("@discordjs/builders");
const Guild = require("../../database/schemas/Guild");
const { MessageEmbed } = require("discord.js");
const { user } = require("tiktok-scraper");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Displays a user avatar")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("get")
        .setDescription("Gets a user's avatar")
        .addUserOption((option) =>
          option.setName("user").setDescription("User to fetch avatar from")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("guild")
        .setDescription("Gets a user's guild avatar, if they have one")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("User to fetch guild avatar from, if any")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("user")
        .setDescription("Gets your avatar or a user's main avatar")
        .addUserOption((option) =>
          option.setName("user").setDescription("User to fetch avatar from")
        )
    ),
  async execute(interaction) {
    const guildDB = await Guild.findOne({
      guildId: interaction.guild.id,
    });

    const language = require(`../../data/language/${guildDB.language}.json`);

    const subcommand = interaction.options.getSubcommand();
    let member;

    if (subcommand === "get") {
      // "get" subcommand: fetch user avatar
      member = interaction.options.getUser("user") || interaction.user;

      const embed = new MessageEmbed()
        .setAuthor({
          name: `${language.pfpAvatar.replace("{user}", `${member.tag}`)}`,
          iconURL: member.displayAvatarURL({ dynamic: true, size: 512 }),
          url: member.displayAvatarURL({ dynamic: true, size: 512 }),
        })
        .setImage(
          member.displayAvatarURL({
            dynamic: true,
            size: 512,
            format: "png",
          })
        )
        .setFooter({
          text: interaction.member.displayName,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp()
        .setColor(member.displayHexColor);
      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === "guild") {
      // "guild" subcommand: fetch guild avatar for a specific user, if any
      member = interaction.options.getUser("user") || interaction.user;

      const embed = new MessageEmbed()
        .setAuthor({
          name: `${member.username}'s Guild Avatar`,
          iconURL: member.avatarURL({ dynamic: true, size: 512 }),
          url: member.avatarURL({ dynamic: true, size: 512 }),
        })
        .setImage(
          member.avatarURL({
            dynamic: true,
            size: 512,
            format: "png",
          })
        )
        .setFooter({
          text: interaction.member.displayName,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp()
        .setColor("#ff0000"); // You can change the guild avatar embed color
      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === "user") {
      // "user" subcommand: fetch the user's main avatar (interaction.user or the specified user)
      member = interaction.options.getUser("user") || interaction.user;

      const embed = new MessageEmbed()
        .setAuthor({
          name: `${language.userAvatar.replace("{user}", member.tag)}`,
          iconURL: member.displayAvatarURL({ dynamic: true, size: 512 }),
          url: member.displayAvatarURL({ dynamic: true, size: 512 }),
        })
        .setImage(
          member.displayAvatarURL({
            dynamic: true,
            size: 512,
            format: "png",
          })
        )
        .setFooter({
          text: interaction.member.displayName,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp()
        .setColor(interaction.member.displayHexColor);
      return interaction.reply({ embeds: [embed] });
    }
  },
};
