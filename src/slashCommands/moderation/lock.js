const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Guild = require("../../database/schemas/Guild.js");
const Logging = require("../../database/schemas/logging.js");
const send = require("../../packages/logs/index.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Locks a channel in the server")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel to lock")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("The reason to lock the channel"),
    )
    .setContexts(0)
    .setIntegrationTypes(0),
  async execute(interaction) {
    try {
      const client = interaction.client;
      const fail = interaction.client.emoji.fail;
      const success = interaction.client.emoji.success;

      const logging = await Logging.findOne({ guildId: interaction.guild.id });
      const guildDB = await Guild.findOne({ guildId: interaction.guild.id });
      const language = require(`../../data/language/${guildDB.language}.json`);
      let channel = interaction.options.getChannel("channel");
      let reason = interaction.options.getString("reason");

      if (channel) {
        reason = reason || "`none`";
      } else channel = interaction.channel;

      if (
        channel.permissionsFor(interaction.guild.id).has("SEND_MESSAGES") ===
        false
      ) {
        const lockchannelError2 = new MessageEmbed()
          .setDescription(`${fail} | ${channel} is already locked`)
          .setColor(client.color.red);
        return interaction.reply({
          embeds: [lockchannelError2],
          ephemeral: true,
        });
      }

      channel.permissionOverwrites
        .edit(interaction.guild.me, { SEND_MESSAGES: true })
        .catch(() => { });

      channel.permissionOverwrites
        .edit(interaction.guild.id, { SEND_MESSAGES: false })
        .catch(() => { });

      channel.permissionOverwrites
        .edit(interaction.member.id, { SEND_MESSAGES: true })
        .catch(() => { });

      const embed = new MessageEmbed()
        .setDescription(
          `${success} | Successfully locked **${channel}** ${logging && logging.moderation.include_reason === "true"
            ? `\n\n**Reason:** ${reason}`
            : ``
          }`,
        )
        .setColor(client.color.green);
      interaction
        .reply({ embeds: [embed] })
        .then(() => {
          if (logging && logging.moderation.delete_reply === "true") {
            setTimeout(() => {
              interaction.deleteReply().catch(() => { });
            }, 5000);
          }
        })
        .catch(() => { });

      if (logging) {
        if (logging.moderation.delete_after_executed === "true") {
          interaction.delete().catch(() => { });
        }

        const role = interaction.guild.roles.cache.get(
          logging.moderation.ignore_role,
        );
        const channel = interaction.guild.channels.cache.get(
          logging.moderation.channel,
        );

        if (logging.moderation.toggle == "true") {
          if (channel) {
            if (interaction.channel.id !== logging.moderation.ignore_channel) {
              if (
                !role ||
                (role &&
                  !interaction.member.roles.cache.find(
                    (r) => r.name.toLowerCase() === role.name,
                  ))
              ) {
                if (logging.moderation.lock == "true") {
                  let color = logging.moderation.color;
                  if (color == "#000000") color = interaction.client.color.red;

                  let logcase = logging.moderation.caseN;
                  if (!logcase) logcase = `1`;

                  let reason = interaction.options.getString("reason");
                  if (!reason) reason = `${language.noReasonProvided}`;
                  if (reason.length > 1024)
                    reason = reason.slice(0, 1021) + "...";

                  const logEmbed = new MessageEmbed()
                    .setAuthor(
                      `Action: \`Lock\` | ${interaction.user.tag} | Case #${logcase}`,
                      interaction.user.displayAvatarURL({ format: "png" }),
                    )
                    .addField("Channel", `${channel}`, true)
                    .addField("Moderator", `${interaction.user}`, true)
                    .addField("Reason", `${reason}`, true)
                    .setFooter({ text: `ID: ${interaction.user.id}` })
                    .setTimestamp()
                    .setColor(color);

                    send(channel, { username: `${this.client.user.username}`, embeds: [logEmbed] }).catch(() => {});

                  logging.moderation.caseN = logcase + 1;
                  await logging.save().catch(() => { });
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
