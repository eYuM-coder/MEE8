const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const ms = require("ms");
const Logging = require("../../database/schemas/logging.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a person in the server!")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Person who you want to ban.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("The reason of the ban")
    )
    .setContexts(0)
    .setIntegrationTypes(0),
  async execute(interaction) {
    try {
      const client = interaction.client;
      const logging = await Logging.findOne({
        guildId: interaction.guild.id,
      });
      if (!interaction.member.permissions.has("MODERATE_MEMBERS"))
        return interaction.followUp({
          content: "You do not have permission to use this command.",
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

      if (member === interaction.user) {
        let banerror = new MessageEmbed()
          .setColor("RED")
          .setDescription(`${client.emoji.fail} | You can't ban yourself!`);
        return interaction
          .reply({ embeds: [banerror] })
          .then(async () => {
            if (logging && logging.moderation.delete_reply === "true") {
              setTimeout(() => {
                interaction.deleteReply().catch(() => {});
              }, 5000);
            }
          })
          .catch(() => {});
      }

      if (member) {
        const response = await member.ban({ reason });
        let bansuccess = new MessageEmbed()
          .setColor("GREEN")
          .setDescription(
            `${
              client.emoji.success
            } | ${member} has been banned. __**Reason:**__ ${
              reason || "No reason Provided"
            }`
          );
        return interaction
          .reply({ embeds: [bansuccess] })
          .then(async () => {
            if (logging && logging.moderation.delete_reply === "true") {
              setTimeout(() => {
                interaction.deleteReply().catch(() => {});
              }, 5000);
            }
          })
          .catch(() => {});
      }
      if (member) {
        let dmEmbed = new MessageEmbed()
          .setColor("RED")
          .setDescription(
            `You have been banned in **${
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
            `${client.emoji.fail} | I cannot ban that member. Make sure my role is above their role or that I have sufficient perms to execute the command.`
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
                if (logging.moderation.ban == "true") {
                  let color = logging.moderation.color;
                  if (color == "#000000") color = interaction.client.color.red;

                  let logcase = logging.moderation.caseN;
                  if (!logcase) logcase = `1`;

                  const logEmbed = new MessageEmbed()
                    .setAuthor(
                      `Action: \`Ban\` | ${member.user.tag} | Case #${logcase}`,
                      member.user.displayAvatarURL({ format: "png" })
                    )
                    .addField("User", `${member}`, true)
                    .addField("Moderator", `${interaction.user}`, true)
                    .addField("Reason", `${reason}`, true)
                    .setFooter({ text: `ID: ${member.id}` })
                    .setTimestamp()
                    .setColor(color);

                  channel.send({ embeds: [logEmbed] }).catch((e) => {
                    console.log(e);
                  });

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
        content: "This command cannot be used in Direct Messages.",
        ephemeral: true,
      });
    }
  },
};
