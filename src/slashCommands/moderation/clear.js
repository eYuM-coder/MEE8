const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Logging = require("../../database/schemas/logging.js");
const logger = require("../../utils/logger.js");
let messageDisplay = "messages";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Purges a channels messages")
    .addIntegerOption((option) =>
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
      interaction.deferReply({ ephemeral: true });
      const logging = await Logging.findOne({ guildId: interaction.guild.id });

      const client = interaction.client;
      const fail = client.emoji.fail;
      const success = client.emoji.success;

      const amount = interaction.options.getInteger("amount");
      const channel = interaction.channel;
      const reason = interaction.options.getString("reason");

      if (amount < 0 || amount > 200) {
        let invalidamount = new MessageEmbed()
          .setAuthor({
            name: `${interaction.user.tag}`,
            iconURL: interaction.member.displayAvatarURL({ dynamic: true }),
          })
          .setTitle(`${fail} | Purge Error`)
          .setDescription(`Please Provide a message count between 1 and 200!`)
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
      messages = amount;

      let totalDeleted = 0;

      while (totalDeleted < amount) {
        const messagesToDelete = Math.min(100, amount - totalDeleted);
        try {
          const deletedMessages = await channel.bulkDelete(messagesToDelete, true);
          totalDeleted += deletedMessages.size;
          logger.info(`Deleted ${deletedMessages.size} ${deletedMessages.size === 1 ? "message" : "messages"}.`, { label: "Purge" });
        } catch (error) {
          logger.info(`Error deleting messages: ${error}`, { label: "ERROR" });
          return interaction.editReply({ content: "There was an error trying to delete messages in this channel.", ephemeral: true });
        }
      }

      if (totalDeleted === 0) {
        interaction.editReply({
          embeds: [
            new MessageEmbed()
              .setDescription(
                `
            ${fail} | Unable to find any messages. 
            `,
              )
              .setColor(interaction.client.color.red),
          ],
          ephemeral: true,
        });
      } else {
        channel.bulkDelete(messages, true).then((messages) => {
          const embed = new MessageEmbed()

            .setDescription(
              `${success} | ***Successfully deleted ${totalDeleted} ${totalDeleted === 1 ? "message" : "messages"}* || ${reason}**`,
            )

            .setColor(interaction.client.color.green);

          interaction.editReply({ embeds: [embed], ephemeral: true });
        });
      }

      if (logging) {
        const role = interaction.guild.roles.cache.get(
          logging.moderation.ignore_role
        );
        const loggingChannel = interaction.guild.channels.cache.get(
          logging.moderation.channel
        );

        if (logging.moderation.toggle == "true") {
          if (loggingChannel) {
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

                  loggingChannel.send({ embeds: [logEmbed] }).catch(() => {});

                  logging.moderation.caseN = logcase + 1;
                  await logging.save().catch(() => {});
                }
              }
            }
          }
        }
      }
    } catch (err) {
      logger.info(`An error occurred. ${err}`, { label: "ERROR" });
      interaction.reply({
        content: "This command cannot be used in Direct Messages.",
        ephemeral: true,
      });
    }
  },
};
