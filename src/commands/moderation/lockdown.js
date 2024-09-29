const Command = require("../../structures/Command");
const { MessageEmbed } = require("discord.js");
const Guild = require("../../database/schemas/Guild");
const Logging = require("../../database/schemas/logging");

module.exports = class LockdownCommand extends Command {
  constructor(...args) {
    super(...args, {
      name: "lockdown",
      description: "Locks down the server.",
      category: "Moderation",
      usage: "<start/end> [reason]",
      examples: [
        "lockdown start Staff Day", 
        "lockdown start Raid Prevention", 
        "lockdown end Staff Day is over", 
        "lockdown end Action has been taken against raiders."
      ],
      guildOnly: true,
      botPermission: ["MANAGE_CHANNELS"],
      userPermission: ["MANAGE_CHANNELS"],
    });
  }

  async run(message, args) {
    const client = message.client;
    const fail = client.emoji.fail;
    const success = client.emoji.success;

    // Fetch logging and guild settings
    const logging = await Logging.findOne({ guildId: message.guild.id });
    const guildDB = await Guild.findOne({ guildId: message.guild.id });
    const language = require(`../../data/language/${guildDB.language}.json`);

    const option = args[0];
    const reason = args.slice(1).join(" ") || "none"; // Fixed how reason is handled

    // Validate option
    if (!option || (option !== "start" && option !== "end")) {
      const embed = new MessageEmbed()
        .setDescription(`${fail} | Invalid option. Use \`start\` or \`end\`.`)
        .setColor(client.color.red);
      return message.channel.sendCustom({ embeds: [embed] });
    }

    // Handle lockdown start
    if (option === "start") {
      await this.modifyChannelPermissions(message.guild.channels.cache, message.guild.id, false);

      const embed = new MessageEmbed()
        .setDescription(
          `${success} | Successfully locked down the server.` +
          (logging?.moderation.include_reason === "true" ? `\n\n**Reason:** ${reason}` : "")
        )
        .setColor(client.color.green);
      return message.channel.sendCustom({ embeds: [embed] });
    
    // Handle lockdown end
    } else if (option === "end") {
      await this.modifyChannelPermissions(message.guild.channels.cache, message.guild.id, true);

      const embed = new MessageEmbed()
        .setDescription(
          `${success} | Successfully unlocked the server.` +
          (logging?.moderation.include_reason === "true" ? `\n\n**Reason:** ${reason}` : "")
        )
        .setColor(client.color.green);
      return message.channel.sendCustom({ embeds: [embed] });
    }
  }

  // Function to modify channel permissions
  async modifyChannelPermissions(channels, guildId, allowMessages) {
    for (const [_, channel] of channels) {
      try {
        await channel.permissionOverwrites.edit(guildId, { SEND_MESSAGES: allowMessages });
      } catch (err) {
        console.error(`Failed to modify permissions for channel ${channel.name}:`, err);
      }
    }
  }
};
