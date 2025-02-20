const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const ms = require("ms");
const Logging = require("../../database/schemas/logging.js");
const Guild = require("../../database/schemas/Guild.js");
const send = require("../../packages/logs/index.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a person in the server!")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Person who you want to kick.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("The reason of the kick")
    )
    .setContexts(0)
    .setIntegrationTypes(0),
  async execute(interaction) {
    try {
      const client = interaction.client;
      const logging = await Logging.findOne({
        guildId: interaction.guild.id,
      });

      const guildDB = await Guild.findOne({
        guildId: interaction.guild.id,
      });

      const language = require(`../../data/language/${guildDB.language}.json`);
      if (!interaction.member.permissions.has("KICK_MEMBERS"))
        return interaction.followUp({
          content: "You do not have permission to use this command.",
          ephemeral: true,
        });

      const member = interaction.options.getMember("member");
      const reason =
        interaction.options.getString("reason") || "No reason provided";

      if (!member) {
        let usernotfound = new MessageEmbed()
          .setColor("RED")
          .setDescription(`${client.emoji.fail} | I can't find that member`);
        return interaction
          .reply({ embeds: [usernotfound] })
          .then(async () => {
            if (logging && logging.moderation.delete_reply === "true") {
              setTimeout(() => {
                interaction.deleteReply().catch(() => {});
              }, 5000);
            }
          })
          .catch(() => {});
      }

      if (member === interaction.author) {
        let kickerror = new MessageEmbed()
          .setColor("RED")
          .setDescription(`${client.emoji.fail} | You can't kick yourself!`);
        return interaction
          .reply({ embeds: [kickerror] })
          .then(async () => {
            if (logging && logging.moderation.delete_reply === "true") {
              setTimeout(() => {
                interaction.deleteReply().catch(() => {});
              }, 5000);
            }
          })
          .catch(() => {});
      }

      const response = await member.kick({ reason });

      if (response) {
        let kicksuccess = new MessageEmbed()
          .setColor("GREEN")
          .setDescription(
            `${
              client.emoji.success
            } | ${member} has been kicked. __**Reason:**__ ${
              reason || "No reason Provided"
            }`
          );
        return interaction
          .reply({ embeds: [kicksuccess] })
          .then(async () => {
            if (logging && logging.moderation.delete_reply === "true") {
              setTimeout(() => {
                interaction.deleteReply().catch(() => {});
              }, 5000);
            }
          })
          .catch(() => {});
      }
      if (response) {
        let dmEmbed = new MessageEmbed()
          .setColor("RED")
          .setDescription(
            `You have been kicked in **${
              interaction.guild.name
            }**.\n\n__**Moderator:**__ ${interaction.author} **(${
              interaction.author.tag
            })**\n__**Reason:**__ ${reason || "No Reason Provided"}`
          )
          .setTimestamp();
        member.send({ embeds: [dmEmbed] });
      } else {
        let failembed = new MessageEmbed()
          .setColor(client.color.red)
          .setDescription(
            `${client.emoji.fail} | That member is a mod/admin, I can't do that.`
          )
          .setTimestamp();
        return interaction.reply({ embeds: [failembed] });
      }

      if (logging) {
        const role = interaction.guild.roles.cache.get(
          logging.moderation.ignore_role
        );
        const channel = interaction.guild.channels.cache.get(
          logging.moderation.channel
        );

        if (logging.moderation.toggle == "true") {
          if (channel) {
            if (interaction.channel.id !== logging.moderation.ignore_channel) {
              if (
                !role ||
                (role &&
                  !interaction.member.roles.cache.find(
                    (r) => r.name.toLowerCase() === role.name
                  ))
              ) {
                if (logging.moderation.kick == "true") {
                  let color = logging.moderation.color;
                  if (color == "#000000") color = interaction.client.color.red;

                  let logcase = logging.moderation.caseN;
                  if (!logcase) logcase = `1`;

                  let reason = interaction.options.getString("reason");
                  if (!reason) reason = `${language.noReasonProvided}`;
                  if (reason.length > 1024)
                    reason = reason.slice(0, 1021) + "...";

                  const logEmbed = new MessageEmbed()
                    .setAuthor({
                      name: `Action: \`Kick\` | ${member.user.tag} | Case #${logcase}`,
                      iconURL: member.user.displayAvatarURL({ format: "png" }),
                    })
                    .addFields(
                      { name: "User", value: `${member}`, inline: true },
                      {
                        name: "Moderator",
                        value: `${interaction.user}`,
                        inline: true,
                      },
                      { name: "Reason", value: `${reason}`, inline: true }
                    )
                    .setFooter({ text: `ID: ${member.id}` })
                    .setTimestamp()
                    .setColor(color);

                  send(channel, {
                    username: `${interaction.client.user.username}`,
                    embeds: [logEmbed],
                  }).catch(() => {});

                  logging.moderation.caseN = logcase + 1;
                  await logging.save().catch(() => {});
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription(
              `${interaction.client.emoji.fail} | That user is a mod/admin, I can't do that.`
            ),
        ],
        ephemeral: true,
      });
    }
  },
};
