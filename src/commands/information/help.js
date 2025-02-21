const { MessageEmbed } = require("discord.js");
const Command = require("../../structures/Command");
const Guild = require("../../database/schemas/Guild");
const { stripIndent } = require("common-tags");
const { MessageButton, MessageActionRow, MessageSelectMenu } = require("discord.js");
const config = require("../../../config.json");
const emojis = require("../../assets/emojis.json");
const fs = require("fs");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "help",
      aliases: ["menu", "bothelp", "commands"],
      description: "Shows you every available command in the guild",
      category: "Information",
      usage: "[command]",
      examples: ["help userinfo", "help avatar"],
      cooldown: 3,
    });
  }

  async run(message, args) {
    const guildDB = await Guild.findOne({ guildId: message.guild.id });

    let disabledCommands = guildDB.disabledCommands;
    if (typeof disabledCommands === "string")
      disabledCommands = disabledCommands.split(" ");

    const prefix = guildDB.prefix;

    const emoji = {
      altdetector: `${emojis.altdetector}`,
      applications: `${emojis.applications}`,
      config: `${emojis.config}`,
      utility: `${emojis.utility}`,
      economy: `${emojis.economy}`,
      fun: `${emojis.fun}`,
      images: `${emojis.images}`,
      information: `${emojis.information}`,
      moderation: `${emojis.moderation}`,
      reactionrole: `${emojis.reactionrole}`,
      tickets: `${emojis.tickets}`,
      owner: `${emojis.owner}`,
    };

    let categories;
    categories = this.client.utils.removeDuplicates(
      this.client.botCommands.filter((cmd) => cmd.category !== "Owner").map((cmd) => cmd.category),
    );

    if (this.client.config.owner.includes(message.author.id) || this.client.config.developers.includes(message.author.id))
      categories = this.client.utils.removeDuplicates(
        this.client.botCommands.map((cmd) => cmd.category),
      );

    const options = [
      {
        label: "Home",
        description: "Click to view all categories",
        value: "home",
      }
    ];

    categories.forEach((category) => {
      options.push({
        label: capitalize(category),
        description: `Click to view ${capitalize(category)} commands`,
        value: category.toLowerCase(),
      });
    });

    const helpinfobutton = new MessageActionRow().addComponents(
      new MessageButton()
        .setLabel("Invite Neonova")
        .setStyle("LINK")
        .setURL(`${process.env.AUTH_DOMAIN}/invite`),

      new MessageButton()
        .setCustomId("info")
        .setLabel("More info")
        .setStyle("SECONDARY"), // can be "PRIMARY", "SECONDARY", "SUCCESS", "DANGER", "LINK", "INFO"
    );

    const row = new MessageActionRow().addComponents(
      new MessageSelectMenu()
      .setCustomId("select")
      .setPlaceholder("Select your option")
      .addOptions(options)
    )

    const green = "<:purple:826033456207233045>";
    const red = "<:redsquare:803527843661217802>";

    if (!args[0]) {
      let embed = new MessageEmbed()
        .setTitle(`${message.client.config.botName}'s categories`)
        .setDescription(`Choose a category from the list below`)
        .setColor("#9C59B6");
      
      categories.forEach((category) => {embed.addField(capitalize(category), "Use the select menu to explore this category!", true)})

      let editEmbed = new MessageEmbed()
        .addFields({
          name: "\u200b",
          value:
            "**[Invite](https://invite.example.com) | " +
            `[Support Server](${process.env.AUTH_DOMAIN}/support) | ` +
            `[Dashboard](${process.env.AUTH_DOMAIN}/dashboard)**`,
        })
        .setTimestamp();

      let sendmsg = await message.channel.send({
        content: " ",
        embeds: [embed],
        components: [helpinfobutton, row],
      });

      const collector = message.channel.createMessageComponentCollector({
        componentType: "SELECT_MENU",
        time: 60000,
        idle: 60000 / 2,
      });

      collector.on("end", async () => {
        await message.channel.edit({ components: [] });
      });

      collector.on("collect", async (collected) => {
        if (!collected.deffered) await collected.deferUpdate();
        const value = collected.values[0];
        if (value != "home") {
          let _commands = "";

          const commandsInCategory = this.client.botCommands.filter((cmd) => cmd.category && cmd.category.toLowerCase() === value.toLowerCase());

          commandsInCategory.forEach((cmd) => { _commands += `- \`${cmd.name}\`: ${cmd.description}\n` });

          editEmbed
            .setDescription(_commands || "No commands found for this category.")
            .setColor("GREEN")
            .setTitle(`${emoji[value]} ${capitalize(value)} Commands`)
            .setFooter({
              text: `Requested by ${message.author.tag} | Total ${capitalize(value)} commands: ${commandsInCategory.size}`,
              iconURL: message.author.displayAvatarURL({ dynamic: true }),
            });
          return await sendmsg.edit({ embeds: [editEmbed] });
        } else {
          sendmsg.edit({ embeds: [embed] });
        }
      });
    } else {
      const cmd =
        this.client.botCommands.get(args[0]) ||
        this.client.botCommands.get(this.client.aliases.get(args[0]));

      if (!cmd)
        return message.channel.sendCustom(
          `${message.client.emoji.fail} Could not find the Command you're looking for`,
        );

      if (cmd.category === "Owner")
        return message.channel.sendCustom(
          `${message.client.emoji.fail} Could not find the Command you're looking for`,
        );

      let embed = new MessageEmbed();
      embed.setTitle(`Command: ${cmd.name}`);
      embed.setDescription(cmd.description);
      embed.setThumbnail(`https://neonova.eyum.org/logo.png`);
      embed.setColor("#9C59B6")
      embed.setFooter(
        cmd.disabled ||
          disabledCommands.includes(args[0] || args[0].toLowerCase())
          ? "This command is currently disabled."
          : message.member.displayName,
        message.author.displayAvatarURL({ dynamic: true }),
      );

      embed.addField("Usage", `\`${cmd.usage}\``, true);
      embed.addField("category", `\`${capitalize(cmd.category)}\``, true);

      if (cmd.aliases && cmd.aliases.length && typeof cmd.aliases === "object")
        embed.addField(
          "Aliases",
          cmd.aliases.map((alias) => `\`${alias}\``, true).join(", "),
          true,
        );
      if (cmd.cooldown && cmd.cooldown > 1)
        embed.addField("Cooldown", `\`${cmd.cooldown}s\``, true);
      if (cmd.examples && cmd.examples.length)
        embed.addField(
          "__**Examples**__",
          cmd.examples
            .map((example) => `<:purple:826033456207233045> \`${example}\``)
            .join("\n"),
        );

      return message.channel.sendCustom({ embeds: [embed] });
    }
  }
};

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
