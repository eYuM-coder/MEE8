const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { mem, cpu, os } = require("node-os-utils");
const { stripIndent } = require("common-tags");

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
    RAM -- ${totalMemMb}MB
    RAM Usage -- ${(heapUsed / 1024 / 1024).toFixed(2)}MB
    `;
    
    // Get all commands, subcommands, and subcommand groups
    const totalCommands = Array.from(interaction.client.slashCommands.values()).reduce((count, cmd) => {
      let commandCount = 1; // Count the base command
      if (cmd.data.options) {
        cmd.data.options.forEach(option => {
          console.log(cmd.data.options.filter((option) => option.type === undefined));
          if (option.type === undefined) { // Subcommand type
            commandCount++;
          } else if (option.type === 2) { // Subcommand group type
            option.options.forEach(subOption => {
              if (subOption.type === 1) { // Subcommand inside a group
                commandCount++;
              }
            });
          }
        });
      }
      return count + commandCount;
    }, 0);

    const response = `${language.neonovaCommands} -- ${totalCommands}`;
    console.log(response);

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
      .setColor(interaction.guild.me.displayHexColor);
    interaction.reply({ embeds: [embed] });
  },
};
