const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  MessageEmbed,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
} = require("discord.js");
const emojis = require("../../assets/emojis.json");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Shows every command the bot currently has"),
  async execute(interaction) {
    const emoji = {
      information: `${emojis.information}`,
      moderation: `${emojis.moderation}`,
      fun: `${emojis.fun}`,
      owner: `${emojis.owner}`,
      config: `${emojis.config}`,
      utility: `${emojis.utility}`,
    };
    const client = interaction.client;
    const row = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId("select")
        .setPlaceholder("Select your option")
        .addOptions([
          {
            label: `Config`,
            description: "Click to see config commands",
            value: "config",
          },
          {
            label: `Fun`,
            description: "Click to see fun commands",
            value: "fun",
          },

          {
            label: `Information`,
            description: "Click to see information commands",
            value: "information",
          },

          {
            label: `Moderation`,
            description: "Click this to see fun commands",
            value: "moderation",
          },

          {
            label: `Owner`,
            description: "Click this to view owner commands (OWNER ONLY)",
            value: "owner",
          },

          {
            label: `Utility`,
            description: "Click this to view utility commands",
            value: "utility",
          },

          {
            label: `Home`,
            description: "Click this to go back to the home page",
            value: "home",
          },
        ]),
    );

    let embed = new MessageEmbed()
      .setTitle(`${interaction.client.config.botName}'s slash commands`)
      .setDescription(`Choose a category from the list below`)
      .addFields(
        {
          name: `${emojis.config} Config`,
          value: "Config Category",
          inline: true,
        },
        { name: `${emojis.fun} Fun`, value: "Fun Category", inline: true },
        {
          name: `${emojis.information} Information`,
          value: "Information Category",
          inline: true,
        },
        {
          name: `${emojis.moderation} Moderation`,
          value: "Moderation Category",
          inline: true,
        },
        {
          name: `${emojis.owner} Owner`,
          value: "Owner Category",
          inline: true,
        },
        {
          name: `${emojis.utility} Utility`,
          value: "Utility Category",
          inline: true,
        },
        {
          name: "\u200b",
          value:
            "**[Invite](https://invite.example.com) | " +
            `[Support Server](${process.env.AUTH_DOMAIN}/support) | ` +
            `[Dashboard](${process.env.AUTH_DOMAIN}/dashboard)**`,
        },
      )
      .setColor("GREEN")
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    let editEmbed = new MessageEmbed()
      .addFields({
        name: "\u200b",
        value:
          "**[Invite](https://invite.example.com) | " +
          `[Support Server](${process.env.AUTH_DOMAIN}/support) | ` +
          `[Dashboard](${process.env.AUTH_DOMAIN}/dashboard)**`,
      })
      .setTimestamp();

    let sendmsg = await interaction.reply({
      content: " ",
      embeds: [embed],
      ephemeral: true,
      components: [row],
    });

    const collector = interaction.channel.createMessageComponentCollector({
      componentType: "SELECT_MENU",
      time: 60000,
      idle: 60000 / 2,
    });
    collector.on("end", async () => {
      await interaction.editReply({ components: [] });
    });

    collector.on("collect", async (collected) => {
      if (!collected.deffered) await collected.deferUpdate();
      const value = collected.values[0];
      if (value != "home") {
        let _commands = "";
        const commandFiles = fs
          .readdirSync(`./src/slashCommands/${value}`)
          .filter((file) => file.endsWith(".js"));

        for (const file of commandFiles) {
          const command = require(`../${value}/${file}`);
          _commands += `- \`${command.data.name}\` - ${command.data.description}\n`;
        }

        editEmbed
          .setDescription(_commands)
          .setColor("GREEN")
          .setTitle(`${emoji[value]} ${capitalize(value)} Commands`)
          .setFooter({
            text: `Requested by ${interaction.user.tag} | Total ${capitalize(value)} commands: ${commandFiles.length}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          });
        return await interaction.editReply({ embeds: [editEmbed] });
      } else {
        interaction.editReply({ embeds: [embed] });
      }
    });
  },
};

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
