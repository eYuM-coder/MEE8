const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Logging = require("../../database/schemas/logging.js");
const logger = require("../../utils/logger.js");
const send = require("../../packages/logs/index.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Purges a channels messages (limit: 1000)")
    .addStringOption((option) =>
      option
        .setName("amount")
        .setDescription("Amount of messages to clear")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("The reason for the purge")
    )
    .addChannelOption((option) => option.setName("channel").setDescription("The optional channel."))
    .setContexts(0)
    .setIntegrationTypes(0),
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const logging = await Logging.findOne({ guildId: interaction.guild.id });

      const client = interaction.client;
      const fail = client.emoji.fail;
      const success = client.emoji.success;

      const amount = parseInt(interaction.options.getString("amount"));
      const channel = interaction.options.getChannel("channel") || interaction.channel;
      let reason = interaction.options.getString("reason");
      if (!reason) {
        reason = "No reason provided.";
      }
      if (reason.length > 1024) {
        reason = reason.slice(0, 1021) + "...";
      }

      if (isNaN(amount) || amount < 0 || amount > 1000) {
        let invalidamount = new MessageEmbed()
          .setAuthor({
            name: `${interaction.user.tag}`,
            iconURL: interaction.member.displayAvatarURL({ dynamic: true }),
          })
          .setTitle(`${fail} | Purge Error`)
          .setDescription(`Please Provide a message count between 1 and 1000!`)
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

      let totalDeleted = 0;
      const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds
      const now = Date.now(); // Current timestamp

      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      while (totalDeleted < amount) {
        const messagesToFetch = Math.min(100, amount - totalDeleted);
        try {
          // Fetch messages
          const fetchedMessages = await channel.messages.fetch({
            limit: messagesToFetch,
            before: interaction.id,
          });

          // Filter out messages older than 14 days
          const validMessages = fetchedMessages.filter(
            (msg) => now - msg.createdTimestamp < TWO_WEEKS
          );

          if (validMessages.size === 0) break; // No eligible messages to delete

          // Bulk delete the valid messages
          const deletedMessages = await channel.bulkDelete(validMessages, true);

          totalDeleted += deletedMessages.size;

          logger.info(
            `Deleted ${deletedMessages.size} ${deletedMessages.size === 1 ? "message" : "messages"
            }.`,
            { label: "Purge" }
          );

          // If fewer than `messagesToFetch` were deleted, stop early
          if (deletedMessages.size < messagesToFetch) {
            break;
          } else if (deletedMessages.size !== 100 && deletedMessages.size == messagesToFetch) {
            break;
          }
        } catch (error) {
          logger.error(`Error deleting messages: ${error}`, { label: "ERROR" });
          return interaction.editReply({
            content:
              "There was an error trying to delete messages in this channel.",
          });
        }
        await delay(5000);
      }

      if (channel == interaction.channel) {
        if (totalDeleted > 100) {
          const embed = new MessageEmbed()
            .setDescription(`${success} | ***Found and purged ${totalDeleted} ${totalDeleted === 1 ? "message" : "messages"}.* || ${reason}**`)
            .setColor(interaction.client.color.green);
          interaction.editReply({ embeds: [embed], ephemeral: true });
        } else {
          const embed = new MessageEmbed()

            .setDescription(
              `${success} | ***Successfully deleted ${totalDeleted} ${totalDeleted === 1 ? "message" : "messages"
              }.* || ${reason}**`
            )

            .setColor(interaction.client.color.green);

          interaction.editReply({ embeds: [embed], ephemeral: true });
        }
      } else {
        const embed = new MessageEmbed()

          .setDescription(
            `${success} | ***Found and purged ${totalDeleted} ${totalDeleted === 1 ? "message" : "messages"
            } in ${channel}.* || ${reason}**`
          )

          .setColor(interaction.client.color.green);

        interaction.editReply({ embeds: [embed], ephemeral: true });
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
                      interaction.member.displayAvatarURL({ format: "png" })
                    )
                    .addField("Moderator", `${interaction.member}`, true)
                    .setTimestamp()
                    .setFooter({
                      text: `Responsible ID: ${interaction.member.id}`,
                    })
                    .setColor(color);

                  send(loggingChannel, { username: `${this.client.user.username}`, embeds: [logEmbed] }).catch(() => { });

                  logging.moderation.caseN = logcase + 1;
                  await logging.save().catch(() => { });
                }
              }
            }
          }
        }
      }
    } catch (err) {
      logger.info(`An error occurred: ${err}`, { label: "ERROR" });
      interaction.editReply({
        content: "This command cannot be used in Direct Messages.",
        ephemeral: true,
      });
    }
  },
};
