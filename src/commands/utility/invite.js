const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js");
const Command = require("../../structures/Command");
const Guild = require("../../database/schemas/Guild");
const client = require("../../../index.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "invite",
      aliases: ["inv"],
      description: "Sends you MEE8's invite link",
      category: "Utility",
      cooldown: 3,
    });
  }

  async run(message) {
    const guildDB = await Guild.findOne({
      guildId: message.guild.id,
    });

    const language = require(`../../data/language/${guildDB.language}.json`);

    const embed = new MessageEmbed()
      .setColor(message.guild.me.displayHexColor)
      .setTitle("Invite MEE8")
      .setURL(`${process.env.AUTH_DOMAIN}/invite`)
      .setThumbnail(message.client.user.displayAvatarURL())
      .setDescription(language.invite)
      .setFooter({
        text: message.client.user.username,
        iconURL: message.client.user.displayAvatarURL(),
      });
    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setLabel("Invite MEE8")
        .setStyle("LINK")
        .setURL(`${process.env.AUTH_DOMAIN}/invite`),

      new MessageButton()
        .setCustomId("support")
        .setLabel("More info")
        .setStyle("SECONDARY") // can be "PRIMARY", "SECONDARY", "SUCCESS", "DANGER", "LINK", "INFO"
    );

    await message.channel.send({ embeds: [embed], components: [row] });
  }
};
