const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const customCommand = require("../../database/schemas/customCommand.js");
const Guild = require("../../database/schemas/Guild");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("createcommand")
    .setDescription("Create a custom command")
    .addStringOption(option =>
      option.setName("command")
        .setDescription("The command name")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reply")
        .setDescription("The reply message")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("title")
        .setDescription("Embed title (optional)")
    )
    .addStringOption(option =>
      option.setName("description")
        .setDescription("Embed description (optional)")
    )
    .addStringOption(option =>
      option.setName("color")
        .setDescription("Embed color in HEX (optional)")
    )
    .addStringOption(option =>
      option.setName("footer")
        .setDescription("Embed footer text (optional)")
    )
    .addStringOption(option =>
      option.setName("thumbnail")
        .setDescription("Embed thumbnail URL (optional)")
    )
    .addStringOption(option =>
      option.setName("image")
        .setDescription("Embed image URL (optional)")
    )
    .addBooleanOption(option =>
      option.setName("timestamp")
        .setDescription("Include timestamp? (optional)")
    )
    .setContexts(0) // Keeping it as requested
    .setIntegrationTypes(0), // Keeping it as requested

  async execute(interaction) {
    const guildDB = await Guild.findOne({ guildId: interaction.guild.id });
    let prefix = guildDB?.prefix || "!";
    const language = require(`../../data/language/${guildDB.language}.json`);

    const name = interaction.options.getString("command").toLowerCase();
    const content = interaction.options.getString("reply");

    if (name.length > 30)
      return interaction.reply({
        content: `${interaction.client.emoji.fail} | ${language.cc1}`,
        ephemeral: true,
      });

    if (content.length > 2000)
      return interaction.reply({
        content: `${interaction.client.emoji.fail} | ${language.cc2}`,
        ephemeral: true,
      });

    if (interaction.client.botCommands.has(name))
      return interaction.reply({
        content: `That command is already an existing bot command!`,
        ephemeral: true,
      });

    if (guildDB.isPremium === "false") {
      const existingCommands = await customCommand.find({ guildId: interaction.guild.id });

      if (existingCommands.length >= 10) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(interaction.guild.members.me.displayHexColor)
              .setDescription(
                `${interaction.client.emoji.fail} | Custom Command Limit Reached **(10)**\n\n[Upgrade to Premium Here for unlimited commands](${process.env.AUTH_DOMAIN}/premium)`
              ),
          ],
          ephemeral: true,
        });
      }
    }

    // Get embed options
    const embedData = {
      title: interaction.options.getString("title") || null,
      description: interaction.options.getString("description") || null,
      color: interaction.options.getString("color") || null,
      footer: interaction.options.getString("footer") || null,
      thumbnail: interaction.options.getString("thumbnail") || null,
      image: interaction.options.getString("image") || null,
      timestamp: interaction.options.getBoolean("timestamp") ? new Date().toISOString() : null,
    };

    // Remove null values from the embed object
    Object.keys(embedData).forEach(key => {
      if (embedData[key] === null) delete embedData[key];
    });

    // Check if the command already exists
    const existingCommand = await customCommand.findOne({ guildId: interaction.guild.id, name });

    if (existingCommand) {
      return interaction.reply({
        content: `${interaction.client.emoji.fail} | ${language.cc4}`,
        ephemeral: true,
      });
    }

    // Create and save the custom command
    await customCommand.create({
      guildId: interaction.guild.id,
      name,
      content,
      embed: Object.keys(embedData).length > 0 ? embedData : null, // Only save embed if it has fields
    });

    interaction.reply({
      embeds: [
        new MessageEmbed()
          .setAuthor({
            name: interaction.user.tag,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          })
          .setDescription(
            `**${language.cc3}** ${name}\n\nDelete the following command using \`${prefix}deletecommand <command-name>\``
          )
          .setTimestamp()
          .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
          .setColor(interaction.guild.members.me.displayHexColor),
      ],
    });
  },
};
