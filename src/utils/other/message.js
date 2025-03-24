const afk = require("../../database/models/afk");
const moment = require("moment");
const { MessageEmbed } = require("discord.js");
const Guild = require("../../database/schemas/Guild");
const Blacklist = require("../../database/schemas/blacklist");
const customCommand = require("../../database/schemas/customCommand");
const autoResponse = require("../../database/schemas/autoResponse");
const inviteFilter = require("../../filters/inviteFilter");
const linkFilter = require("../../filters/linkFilter");
const Maintenance = require("../../database/schemas/maintenance");
const config = require("../../../config.json");
require("moment-duration-format");

const autoResponseCooldown = new Set();

module.exports = function (client) {
  client.on("messageCreate", async (message) => {
    if (!message.guild || message.author.bot) return;

    const settings = await Guild.findOne({ guildId: message.guild.id });
    if (!settings) return;

    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });
    if (maintenance?.toggle === "true") return;

    const userBlacklistSettings = await Blacklist.findOne({
      discordId: message.author.id,
    });
    const guildBlacklistSettings = await Blacklist.findOne({
      guildId: message.guild.id,
    });

    if (
      userBlacklistSettings?.isBlacklisted ||
      guildBlacklistSettings?.isBlacklisted
    )
      return;

    let language = require(`../../data/language/english.json`);
    if (settings.language) {
      language = require(`../../data/language/${settings.language}.json`);
    }

    // **Handle AFK Removal**
    const afkData = await afk.findOne({
      userID: message.author.id,
      serverID: message.guild.id,
    });
    if (afkData) {
      await message.member.setNickname(afkData.oldNickname).catch(() => {});
      await afk.deleteOne({ userID: message.author.id });

      message.channel
        .sendCustom(
          new MessageEmbed()
            .setColor("GREEN")
            .setDescription(`${language.afk7} ${afkData.reason}`)
        )
        .then((m) => setTimeout(() => m.delete().catch(() => {}), 10000));
    }

    // **Auto Response**
    const autoResponseSettings = await autoResponse.findOne({
      guildId: message.guild.id,
      name: message.content.toLowerCase(),
    });

    if (autoResponseSettings && autoResponseSettings.name) {
      if (autoResponseCooldown.has(message.author.id)) {
        return message.channel.sendCustom(
          `${client.emoji.fail} Slow Down - ${message.author}`
        );
      }

      message.channel.sendCustom(
        autoResponseSettings.content
          .replace(/{user}/g, `${message.author}`)
          .replace(/{user_tag}/g, `${message.author.tag}`)
          .replace(/{user_name}/g, `${message.author.username}`)
          .replace(/{user_ID}/g, `${message.author.id}`)
          .replace(/{guild_name}/g, `${message.guild.name}`)
          .replace(/{guild_ID}/g, `${message.guild.id}`)
          .replace(/{memberCount}/g, `${message.guild.memberCount}`)
          .replace(/{size}/g, `${message.guild.memberCount}`)
          .replace(/{guild}/g, `${message.guild.name}`)
          .replace(
            /{member_createdAtAgo}/g,
            moment(message.author.createdTimestamp).fromNow()
          )
          .replace(
            /{member_createdAt}/g,
            moment(message.author.createdAt).format("MMMM Do YYYY, h:mm:ss a")
          )
      );

      autoResponseCooldown.add(message.author.id);
      setTimeout(() => autoResponseCooldown.delete(message.author.id), 2000);
      return;
    }

    // **AFK Mention Check**
    if (message.mentions.members.first()) {
      const mentionedAFK = await afk.findOne({
        userID: message.mentions.members.first().id,
        serverID: message.guild.id,
      });
      if (mentionedAFK) {
        return message.channel.sendCustom(
          `**${
            mentionedAFK.oldNickname ||
            message.mentions.members.first().user.tag
          }** ${language.afk6} ${mentionedAFK.reason} **- ${moment(
            mentionedAFK.time
          ).fromNow()}**`
        );
      }
    }

    // **Filter Handling**
    if (settings && (await inviteFilter(message))) return;
    if (settings && (await linkFilter(message))) return;

    // **Prefix Handling**
    const mentionRegexPrefix = RegExp(`^<@!?${client.user.id}>`);
    const mainPrefix = settings.prefix || config.prefix;
    const prefix = message.content.match(mentionRegexPrefix)
      ? message.content.match(mentionRegexPrefix)[0]
      : mainPrefix;

    if (!message.content.startsWith(prefix)) return;

    const [cmd] = message.content.slice(prefix.length).trim().split(/ +/g);
    if (!cmd) return;

    // **Custom Commands**
    const customCommandSettings = await customCommand.findOne({
      guildId: message.guild.id,
      name: cmd.toLowerCase(),
    });

    if (!customCommandSettings) return;

    // **Custom Embed Handling**
    if (
      customCommandSettings.embed &&
      Object.keys(customCommandSettings.embed).length > 0
    ) {
      const embedData = customCommandSettings.embed;
      const embed = new MessageEmbed()
        .setColor(
          embedData.color !== "default"
            ? embedData.color
            : message.guild.members.me.displayHexColor
        )
        .setTitle(embedData.title || null)
        .setDescription(
          embedData.description
            .replace(/{user}/g, `${message.author}`)
            .replace(/{user_tag}/g, `${message.author.tag}`)
            .replace(/{user_name}/g, `${message.author.username}`)
            .replace(/{user_ID}/g, `${message.author.id}`)
            .replace(/{guild_name}/g, `${message.guild.name}`)
            .replace(/{guild_ID}/g, `${message.guild.id}`)
            .replace(/{memberCount}/g, `${message.guild.memberCount}`)
            .replace(/{size}/g, `${message.guild.memberCount}`)
            .replace(/{guild}/g, `${message.guild.name}`)
            .replace(
              /{member_createdAtAgo}/g,
              moment(message.author.createdTimestamp).fromNow()
            )
            .replace(
              /{member_createdAt}/g,
              moment(message.author.createdAt).format("MMMM Do YYYY, h:mm:ss a")
            ) || null
        )
        .setImage(embedData.image !== "none" ? embedData.image : null)
        .setThumbnail(
          embedData.thumbnail !== "none" ? embedData.thumbnail : null
        )
        .setFooter(
          embedData.footer !== "none"
            ? { text: embedData.footer }
            : { text: `` }
        )
        .setTimestamp(embedData.timestamp !== "no");

      return message.channel.sendCustom({
        content: customCommandSettings.content,
        embeds: [embed],
      });
    }

    // **Custom Text-Based Commands**
    if (!customCommandSettings.description) {
      const content = customCommandSettings.content
        .replace(/{user}/g, `${message.author}`)
        .replace(/{user_tag}/g, `${message.author.tag}`)
        .replace(/{user_name}/g, `${message.author.username}`)
        .replace(/{user_ID}/g, `${message.author.id}`)
        .replace(/{guild_name}/g, `${message.guild.name}`)
        .replace(/{guild_ID}/g, `${message.guild.id}`)
        .replace(/{memberCount}/g, `${message.guild.memberCount}`)
        .replace(/{size}/g, `${message.guild.memberCount}`)
        .replace(/{guild}/g, `${message.guild.name}`)
        .replace(
          /{member_createdAtAgo}/g,
          moment(message.author.createdTimestamp).fromNow()
        )
        .replace(
          /{member_createdAt}/g,
          moment(message.author.createdAt).format("MMMM Do YYYY, h:mm:ss a")
        );

      return message.channel.sendCustom(content);
    }

    // **Custom JSON Command Handling**
    if (customCommandSettings.json === "true") {
      try {
        const command = JSON.parse(customCommandSettings.content);
        return message.channel.sendCustom(command);
      } catch (error) {
        return message.channel.sendCustom(
          `❌ JSON Error: There was a problem sending your embed.  
          Check your syntax here → ${process.env.AUTH_DOMAIN}/embeds  
          __Error:__ \`${error}\``
        );
      }
    }
  });
};
