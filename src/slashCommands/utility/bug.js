const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Discord = require("discord.js");
const config = require("../../../config.json");
const Logging = require("../../database/schemas/logging");
const webhookClient = new Discord.WebhookClient({ url: config.webhooks.bugs });
const Guild = require("../../database/schemas/Guild");
const crypto = require("crypto");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reportbug")
    .setDescription("Report bugs to Neonova!")
    .addStringOption((option) =>
      option.setName("text").setDescription("The text").setRequired(true)
    ),
  async execute(interaction) {
    const guildDB = await Guild.findOne({
      guildId: interaction.guild.id,
    });

    const logging = await Logging.findOne({ guildId: interaction.guild.id });

    const language = require(`../../data/language/${guildDB.language}.json`);

    var id = crypto.randomBytes(4).toString("hex");

    const text = interaction.options.getString("text");
    if (text.length < 1) {
      return interaction
        .reply({
          embeds: [
            new MessageEmbed()
              .setColor(interaction.client.color.red)
              .setDescription(
                `${interaction.client.emoji.fail} | ${language.report1}`
              ),
          ],
        })
        .then(async () => {
          if (logging && logging.moderation.delete_reply === "true") {
            setTimeout(() => {
              interaction.deleteReply().catch(() => {});
            }, 5000);
          }
        })
        .catch(() => {});
    }

    if (text.length < 3) {
      return interaction
        .reply({
          embeds: [
            new MessageEmbed()
              .setColor(interaction.client.color.red)
              .setDescription(
                `${interaction.client.emoji.fail} | ${language.report2}`
              ),
          ],
        })
        .then(async () => {
          if (logging && logging.moderation.delete_reply === "true") {
            setTimeout(() => {
              interaction.deleteReply().catch(() => {});
            }, 5000);
          }
        })
        .catch(() => {});
    }

    let invite = await interaction.channel
      .createInvite({
        maxAge: 0,
        maxUses: 0,
      })
      .catch(() => {});

    let report = text;
    const embed = new MessageEmbed()
      .setTitle("Bug Report")
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setDescription(`${report}`)
      .addFields(
        { name: "User", value: `${interaction.member}`, inline: true },
        {
          name: "User username",
          value: `${interaction.member.user.username}`,
          inline: true,
        },
        { name: "User ID", value: `${interaction.member.id}`, inline: true },
        { name: "User Tag", value: `${interaction.user.tag}`, inline: true },
        {
          name: "Server",
          value: `[${interaction.guild.name}](${invite || "none"})`,
          inline: true,
        },
        { name: "Bug Report ID:", value: `#${id}`, inline: true }
      )
      .setFooter({
        text: interaction.member.displayName,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp()
      .setColor("GREEN");

    const confirmation = new MessageEmbed()
      .setTitle("Bug Report")
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setDescription(
        `${language.report3} Support [**Server**](${config.discord})`
      )
      .addFields(
        { name: "Member", value: `${interaction.member}`, inline: true },
        { name: "Message", value: `${report}`, inline: true },
        { name: "Bug Report ID:", value: `#${id}`, inline: true }
      )
      .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
      .setTimestamp()
      .setColor("GREEN");

    webhookClient.sendCustom({
      username: `${config.botName} Bug Report`,
      avatarURL: `${process.env.AUTH_DOMAIN}/logo.png`,
      embeds: [embed],
    });

    interaction.reply({ embeds: [confirmation] });
  },
};
