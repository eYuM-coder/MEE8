const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Guild = require("../../database/schemas/Guild.js");
const warnModel = require("../../database/models/moderation.js");
const discord = require("discord.js");
const randoStrings = require("../../packages/randostrings.js");
const ms = require("ms");
async function usePrettyMs(ms) {
  const { default: prettyMilliseconds } = await import("pretty-ms");
  const time = prettyMilliseconds(ms);
  return time;
}
/**
 * Instantiates a new randoStrings object to generate random strings.
 */
const random = new randoStrings();
const Logging = require("../../database/schemas/logging");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a user in a specific guild")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("The member to warn")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("The reason for the warn")
    )
    .addStringOption((option) =>
      option.setName("time").setDescription("The time the warning expires at")
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
      let language = require(`../../data/language/${guildDB.language}.json`);

      const mentionedMember = interaction.options.getMember("member");
      const reason =
        interaction.options.getString("reason") || "No Reason Provided";
      const time = ms(
        interaction.options.getString("time") !== null
          ? interaction.options.getString("time")
          : "1d"
      );
      const formattedTime = await usePrettyMs(time);
      const warnTime = time / 1000;

      if (!mentionedMember) {
        let validmention = new MessageEmbed()
          .setColor(client.color.red)
          .setDescription(`${client.emoji.fail} | ${language.warnMissingUser}`)
          .setTimestamp();
        return interaction
          .reply({ embeds: [validmention] })
          .then(async () => {
            if (logging && logging.moderation.delete_reply === "true") {
              setTimeout(() => {
                interaction.deleteReply().catch(() => {});
              }, 5000);
            }
          })
          .catch(() => {});
      }

      let warnID = random.password({
        length: 18,
        string:
          "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
      });

      const expirationTime = new Date();
      expirationTime.setSeconds(expirationTime.getSeconds() + warnTime);

      let warnDoc = await warnModel
        .findOne({
          guildID: interaction.guild.id,
          memberID: mentionedMember.id,
        })
        .catch((err) => console.log(err));

      if (!warnDoc) {
        warnDoc = new warnModel({
          guildID: interaction.guild.id,
          memberID: mentionedMember.id,
          modAction: [],
          warnings: [],
          warningsID: [],
          moderator: [],
          date: [],
          expiresAt: [],
        });

        await warnDoc.save().catch((err) => console.log(err));

        warnDoc = await warnModel.findOne({
          guildID: interaction.guild.id,
          memberID: mentionedMember.id,
        });
      }
      warnDoc.modType.push("warn");
      warnDoc.warnings.push(reason);
      warnDoc.warningID.push(warnID);
      warnDoc.moderator.push(interaction.user.id);
      warnDoc.date.push(Date.now());
      warnDoc.expiresAt.push(expirationTime);

      await warnDoc.save().catch((err) => console.log(err));
      let dmEmbed;
      if (
        logging &&
        logging.moderation.warn_action &&
        logging.moderation.waran_action !== "1"
      ) {
        if (logging.moderation.warn_action === "2") {
          dmEmbed = `${interaction.client.emoji.fail} | You were warned in **${
            interaction.guild.name
          }**.\n\n**Expires** <t:${Math.floor(
            expirationTime.getTime() / 1000
          )}:F>`;
        } else if (logging.moderation.warn_action === "3") {
          dmEmbed = `${interaction.client.emoji.fail} | You were warned in **${
            interaction.guild.name
          }** for ${reason}.\n\n**Expires** <t:${Math.floor(
            expirationTime.getTime() / 1000
          )}:F>`;
        } else if (logging.moderation.warn_action === "4") {
          dmEmbed = `${interaction.client.emoji.fail} | You were warned in **${
            interaction.guild.name
          }** by **${interaction.member} (${
            interaction.member.tag
          })** for ${reason}.\n\n**Expires** <t:${Math.floor(
            expirationTime.getTime() / 1000
          )}:F>`;
        }

        mentionedMember
          .send({
            embeds: [
              new MessageEmbed()
                .setColor(interaction.client.color.red)
                .setDescription(dmEmbed),
            ],
          })
          .catch(() => {});
      }

      if (mentionedMember) {
        interaction
          .reply({
            embeds: [
              new MessageEmbed().setColor(client.color.green)
                .setDescription(`${language.warnSuccessful
                .replace("{emoji}", client.emoji.success)
                .replace("{user}", `**${mentionedMember.user.tag}**`)}
            ${
              logging && logging.moderation.include_reason === "true"
                ? `\n\n**Reason:** ${reason}`
                : ``
            }\n\n**Expires in ${formattedTime}**`),
            ],
          })
          .then(async () => {
            if (logging && logging.moderation.delete_reply === "true") {
              setTimeout(() => {
                interaction.deleteReply().catch(() => {});
              }, 5000);
            }
          })
          .catch(() => {});
      } else {
        let failembed = new MessageEmbed()
          .setColor(client.color.red)
          .setDescription(
            `${client.emoji.fail} | I can't warn that member. Make sure that my role is above their role or that I have sufficient permissions to execute the command.`
          )
          .setTimestamp();
        return interaction.reply({ embeds: [failembed] });
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
