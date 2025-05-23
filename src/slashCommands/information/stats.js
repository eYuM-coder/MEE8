const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { mem, cpu, os } = require("node-os-utils");
const { stripIndent } = require("common-tags");
const { formatFileSize } = require("codeformatterforstrings");

const Guild = require("../../database/schemas/Guild");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Shows the bot's statistics")
    .setContexts(0)
    .setIntegrationTypes(0),
  async execute(interaction) {
    const guildDB = await Guild.findOne({
      guildId: interaction.guild.id,
    });
    const language = require(`../../data/language/${guildDB.language}.json`);
    let uptime = interaction.client.uptime;
    let seconds = uptime / 1000;
    let weeks = parseInt(seconds / 604800);
    seconds = seconds % 604800;
    let days = parseInt(seconds / 86400);
    seconds = seconds % 86400;
    let hours = parseInt(seconds / 3600);
    seconds = seconds % 3600;
    let minutes = parseInt(seconds / 60);
    seconds = parseInt(seconds % 60);
    uptime = `${seconds}s`;
    if (weeks) {
      uptime = `${weeks}w ${hours}h ${minutes}m ${seconds}s`;
    } else if (days) {
      uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else if (hours) {
      uptime = `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes) {
      uptime = `${minutes}m ${seconds}s`;
    }

    let rss = process.memoryUsage().rss;
    if (rss instanceof Array) {
      rss = rss.reduce((sum, val) => sum + val, 0);
    }
    let heapUsed = process.memoryUsage().heapUsed;
    if (heapUsed instanceof Array) {
      heapUsed = heapUsed.reduce((sum, val) => sum + val, 0);
    }
    const { totalMemMb } = await mem.info();
    const serverStats = stripIndent`
    OS -- ${await os.oos()}
    CPU -- ${cpu.model()}
    Cores -- ${cpu.count()}
    CPU Usage -- ${await cpu.usage()}%
    RAM -- ${formatFileSize(totalMemMb * 1024 * 1024)}
    RAM Usage -- ${formatFileSize(heapUsed)}
    `;

    // Get all commands, subcommands, and subcommand groups
    const commandsList = [];/* Array.from(
      interaction.client.slashCommands.values()
    ).flatMap((cmd) => {
      if (
        !cmd.data.options ||
        cmd.data.options.every((option) => option.type >= 3)
      ) {
        return [];
      }

      return cmd.data.options.flatMap((option) => {
        if (!option.options || option.options.every((sub) => sub.type >= 3)) {
          // Direct subcommand (e.g., `/command subcommand`)
          return {
            type: "subcommand",
            name: `${cmd.data.name} ${option.name}`,
          };
        } else {
          // Subcommand group (e.g., `/command group subcommand`)
          return {
            type: "group",
            name: `${cmd.data.name} ${option.name}`,
            subcommands: option.options
              .filter((sub) => !sub.type)
              .map((subOption) => subOption.name),
          };
        }
      });
    });*/

    const totalCommands = commandsList.reduce((count, item) => {
      if (item.type === "group") {
        return count + 1 + item.subcommands.length;
      } else {
        return count + 1;
      }
    }, 0);

    // Filter out commands that contain subcommands
    const filteredCommands = Array.from(
      interaction.client.slashCommands.values()
    ).filter(
      (cmd) =>
        !cmd.data.options || // Keep commands without options (regular commands)
        cmd.data.options.every((option) => option.type >= 3) // Keep commands where all options are arguments
    ).length;

    const response = `${language.neonovaCommands} -- ${
      totalCommands + filteredCommands
    }`;

    const tech = stripIndent`
    Ping -- ${Math.round(interaction.client.ws.ping)}ms
    Uptime -- ${uptime}
    ${language.neonovaVersion} -- 2.5
    Library -- Discord.js v13.6.0
    Environment -- Node.js v16.9.0
    Servers -- ${interaction.client.guilds.cache.size}
    ${language.users} -- ${interaction.client.guilds.cache.reduce(
      (a, b) => a + b.memberCount,
      0
    )}
    ${language.channels} -- ${interaction.client.channels.cache.size}
    ${response}
    `;

    const devs = stripIndent`
    -------
    ${language.neonovaOwners}
    • the4004whelen
    ${language.neonovaDevelopers}
    • Peter_#4444
    • Jano#6969
    • the4004whelen
    and
    neonova.eyum.org/team
    -------
    `;

    const embed = new MessageEmbed()
      .setAuthor({
        name: interaction.member.displayName,
        iconURL: interaction.member.displayAvatarURL({ dynamic: true }),
      })
      .setTitle(`${language.neonovaInfo}`)
      .addFields(
        {
          name: `${language.neonovaGeneral}`,
          value: `\`\`\`css\n${tech}\`\`\``,
          inline: true,
        },
        {
          name: `${language.neonovaTeam}`,
          value: `\`\`\`css\n${devs}\`\`\``,
          inline: true,
        },
        {
          name: `${language.neonovaStats}`,
          value: `\`\`\`css\n${serverStats}\`\`\``,
        }
      )
      .setFooter({ text: `https://neonova.eyum.org` })
      .setTimestamp()
      .setColor(interaction.guild.members.me.displayHexColor);
    interaction.reply({ embeds: [embed] });
  },
};
