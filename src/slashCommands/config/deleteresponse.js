const { SlashCommandBuilder } = require("@discordjs/builders");
const autoResponse = require("../../database/schemas/autoResponse.js");
const Guild = require("../../database/schemas/Guild");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deleteresponse")
    .setDescription("Deletes an auto response")
    .addStringOption((option) =>
      option
        .setName("command")
        .setDescription("The command to delete")
        .setRequired(true)
    )
    .setContexts(0)
    .setIntegrationTypes(0),
  async execute(interaction) {
    const guildDB = await Guild.findOne({
      guildId: interaction.guild.id,
    });

    let prefix = guildDB.prefix;

    const language = require(`../../data/language/${guildDB.language}.json`);

    const name = interaction.options.getString("command");

    if (!name) {
      return interaction
        .reply({
          embeds: [
            new MessageEmbed()
              .setAuthor({
                name: `${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
              })
              .setDescription(
                `${language.properusage} \`${prefix}deleteresponse <cocmmand-name>\`\n\n${language.example}\`${prefix}deleteresponse pog\``
              )
              .setTimestamp()
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` }),
          ],
        })
        .setColor(interaction.guild.members.me.displayHexColor);

      if (name.length > 30)
        return interaction.reply({
          content: `${interaction.client.emoji.fail} | ${language.cc1}`,
        });

      autoResponse.findOne(
        {
          guildId: interaction.guild.id,
          name,
        },
        async (err, data) => {
          if (data) {
            data.delete({ guildId: interaction.guild.id, name });
            interaction.reply({
              embeds: [
                new MessageEmbed()
                  .setColor(interaction.guild.members.me.displayHexColor)
                  .setAuthor({
                    name: `${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL({
                      dynamic: true,
                    }),
                  })
                  .setTitle(
                    `${interaction.client.emoji.success} Delete Auto Response`
                  )
                  .setDescription(`${language.deletecmd1} **${name}**`)
                  .setTimestamp()
                  .setFooter({ text: `${process.env.AUTH_DOMAIN}` }),
              ],
            });
          } else {
            interaction.reply({
              content: `${interaction.client.emoji.fail} | ${language.deletecmd2}`,
            });
          }
        }
      );
    }
  },
};
