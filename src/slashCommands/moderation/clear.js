const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Logging = require("../../database/schemas/logging.js");
let messageDisplay = "messages";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Purges a channels messages")
    .addStringOption((option) =>
      option
        .setName("amount")
        .setDescription("Amount of messages to clear")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("The reason for the purge"),
    ),
  async execute(interaction) {
    try {
      const logging = await Logging.findOne({ guildId: interaction.guild.id });

      const client = interaction.client;
      const fail = client.emoji.fail;
      const success = client.emoji.success;

      const amount = interaction.options.getString("amount");
      const channel =
        interaction.guild.channels.cache.get(interaction.channel.id);
      const reason = interaction.options.getString("reason");
      interaction.deferReply({ ephemeral: true });

      if (amount < 0 || amount > 100) {
        let invalidamount = new MessageEmbed()
          .setAuthor({
            name: `${interaction.user.tag}`,
            iconURL: interaction.member.displayAvatarURL({ dynamic: true }),
          })
          .setTitle(`${fail} | Purge Error`)
          .setDescription(`Please Provide a message count between 1 - 100!`)
          .setTimestamp()
          .setFooter({
            text: `${process.env.AUTH_DOMAIN}`,
          })
          .setColor(client.color.red);
        return interaction.editReply({
          embeds: [invalidamount],
          ephemeral: true,
        });
      }

      let messages;
      if (member) {
        messages = (await channel.messages.fetch({ limit: amount })).filter(
          (m) => m.member.id === member.id,
        );
      } else messages = amount;

      if (messages.size === 0) {
        interaction.editReply({
          embeds: [
            new MessageEmbed()
              .setDescription(
                `
            ${fail} | Unable to find any messages from ${member}. 
            `,
              )
              .setColor(interaction.client.color.red),
          ],
          ephemeral: true,
        });
      } else {
        if (messages == 1) {
          messageDisplay = "message";
        } else {
          messageDisplay = "messages";
        }
        channel.bulkDelete(messages, true).then((messages) => {
          const embed = new MessageEmbed()

            .setDescription(
              `${success} | ***Successfully deleted ${messages.size} ${messageDisplay}* || ${reason}**`,
            )

            .setColor(interaction.client.color.green);

          interaction.editReply({ embeds: [embed], ephemeral: true });
        });
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
                if (logging.moderation.purge == "true") {
                  let color = logging.moderation.color;
                  if (color == "#000000") color = interaction.client.color.red;

                  let logcase = logging.moderation.caseN;
                  if (!logcase) logcase = `1`;

                  const logEmbed = new MessageEmbed()
                    .setAuthor(
                      `Action: \`Purge\` | Case #${logcase}`,
                      message.author.displayAvatarURL({ format: "png" })
                    )
                    .addField("Moderator", `${interaction.user}`, true)
                    .setTimestamp()
                    .setFooter({ text: `Responsible ID: ${interaction.user.id}` })
                    .setColor(color);

                  channel.send({ embeds: [logEmbed] }).catch(() => {});

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
