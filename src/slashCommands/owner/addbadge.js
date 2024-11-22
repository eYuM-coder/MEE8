const { SlashCommandBuilder } = require("@discordjs/builders");
const User = require("../../database/schemas/User");
const { MessageEmbed } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addbadge")
    .setDescription("Add a badge to a user")
    .addStringOption((option) => option.setName("badge").setDescription("The badge to add").setRequired(true))
    .addUserOption((option) => option.setName("member").setDescription("The member to give the badge to"))
    .setContexts([0, 1, 2])
    .setIntegrationTypes(0),
  async execute(interaction) {

    if (!interaction.client.config.owner.includes(interaction.user.id) && interaction.client.config.developers.includes(interaction.user.id)) {
      return interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(`${interaction.client.emoji.fail} | This command is for the owner.`)
        ], ephemeral: true
      })
    }

    let user = interaction.options.getMember("member") || interaction.member;

    if (!user) return interaction.reply({ content: "Provide me with a user.", ephemeral: true });

    const badge = interaction.options.getString("badge");
    if (!badge) return interaction.reply({ content: "Provide me with a badge", ephemeral: true });

    let userFind = await User.findOne({
      discordId: user.id,
    });

    if (!userFind) {
      const newUser = new User({
        discordId: interaction.user.id,
      });

      newUser.save();
      userFind = await User.findOne({
        discordId: user.id,
      });
    }

    if (userFind.badges && userFind.badges.includes(badge)) return interaction.reply({ content: `They already have that badge`, ephemeral: true });

    userFind.badges.push(badge);
    await userFind.save().catch(() => { });
    interaction.reply({ content: `Added the "${badge}" badge to the user!`, ephemeral: true });
  }
};
