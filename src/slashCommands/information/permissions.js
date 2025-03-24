const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const moment = require("moment");
const permissions = require("../../assets/json/permissions.json");
moment.suppressDeprecationWarnings = true;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("permissions")
    .setDescription("Gets the permissions of a user.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to get the permissions of.")
    )
    .setContexts(0)
    .setIntegrationTypes(0),
  async execute(interaction) {
    const member = interaction.options.getMember("user") || interaction.member;

    const memberPermissions = member.permissions.toArray();
    const finalPermissions = [];
    for (const permission in permissions) {
      if (memberPermissions.includes(permission))
        finalPermissions.push(`+ ${permissions[permission]}`);
      else finalPermissions.push(`- ${permissions[permission]}`);
    }

    const embed = new MessageEmbed()
      .setTitle(`${member.displayName}'s permissions`)
      .setDescription(`\`\`\`diff\n${finalPermissions.join("\n")}\n\`\`\``)
      .setFooter({
        text: interaction.user.tag,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp()
      .setColor(interaction.guild.members.me.displayHexColor);
    interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
