const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Logging = require("../../database/schemas/logging");
const logger = require("../../utils/logger");
const Guild = require("../../database/schemas/Guild");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a person in the server!")
    .addStringOption((option) =>
      option
        .setName("member")
        .setDescription("Mention, tag, or ID of the person you want to unban")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("The reason for the unban")
    ),
  async execute(interaction) {
    try {
      await interaction.deferReply();
      const client = interaction.client;
      const logging = await Logging.findOne({
        guildId: interaction.guild.id,
      });
      const guildDB = await Guild.findOne({
        guildId: interaction.guild.id,
      });

      const language = require(`../../data/language/${guildDB.language}.json`);

      // Check if the user has proper permissions
      if (!interaction.member.permissions.has("BAN_MEMBERS")) {
        return interaction.editReply({
          content: `${language.unbanNoPerm}`,
          ephemeral: true,
        });
      }

      // Fetch the options
      const input = interaction.options.getString("member");
      let reason =
        interaction.options.getString("reason") || `${language.unbanNoReason}`;

      // Fetch all bans to find the user
      const bans = await interaction.guild.bans.fetch();
      const totalBans = bans.size;
      let successCount = 0;
      let failCount = 0;

      if (input === "all") {
        let reason = `Unban All / ${language.unbanResponsible}: ${interaction.user.username}`;
        await interaction.editReply(
          `Beginning mass unban of ${totalBans} ${
            totalBans === 1 ? "user" : "users"
          }...`
        );
        for (const ban of bans.values()) {
          try {
            await interaction.guild.members.unban(ban.user.id, reason);
            successCount++;

            if (successCount % 1 === 0) {
              const progress = successCount + failCount;
              const percentage = ((progress / totalBans) * 100).toFixed(2);
              await interaction.editReply(
                `Progress: ${progress}/${totalBans} (${percentage}%)\n` +
                  `${client.emoji.success} Successful: ${successCount} | ${client.emoji.fail} Failed: ${failCount}`
              );
            }

            let dmEmbed;
            if (
              logging &&
              logging.moderation.warn_action &&
              logging.moderation.warn_action !== "1"
            ) {
              if (logging.moderation.warn_action === "2") {
                dmEmbed = `${interaction.client.emoji.fail} | You were unbanned in **${interaction.guild.name}**.`;
              } else if (logging.moderation.warn_action === "3") {
                dmEmbed = `${interaction.client.emoji.fail} | You were unbanned in **${interaction.guild.name}**. | ${reason}`;
              } else if (logging.moderation.warn_action === "4") {
                dmEmbed = `${interaction.client.emoji.fail} | You were unbanned in **${interaction.guild.name}** by **${interaction.member} (${interaction.member.tag})**. | ${reason}`;
              }
            }

            ban.user.send({ embeds: [
              new MessageEmbed()
              .setColor(interaction.client.color.green)
              .setDescription(dmEmbed)
            ] })
          } catch (error) {
            logger.error(`Failed to unban ${ban.user.tag}:` + error, {
              label: "ERROR",
            });
          }
        }
      } else {
        // Try to find the user based on ID, tag, or mention
        const banInfo = bans.find((ban) => {
          return (
            ban.user.id === input || // Match by ID
            ban.user.tag === input || // Match by tag (username#discriminator)
            `<@${ban.user.id}>` === input // Match by mention
          );
        });

        if (!banInfo) {
          return interaction.editReply({
            content:
              `${language.unbanInvalidId}`,
            ephemeral: true,
          });
        }

        // Unban the user
        await interaction.guild.bans.remove(banInfo.user.id, reason);

        // Reply with a success message
        const unbanSuccessEmbed = new MessageEmbed()
          .setColor("GREEN")
          .setDescription(
            `${client.emoji?.success || "✅"} | <@${
              banInfo.user.id
            }> ${language.unbanSuccess}.\n__**Reason:**__ ${reason}`
          );

        await interaction.editReply({ embeds: [unbanSuccessEmbed] });

        // Optional: Delete reply if configured
        if (logging && logging.moderation?.delete_reply === "true") {
          setTimeout(() => {
            interaction.deleteReply().catch(() => {});
          }, 5000);
        }

        // Notify the user via DM
        const dmEmbed = new MessageEmbed()
          .setColor("GREEN")
          .setDescription(
            `You have been unbanned from **${interaction.guild.name}**.\n\n__**Moderator:**__ ${interaction.user.tag}\n__**Reason:**__ ${reason}`
          );

        banInfo.user.send({ embeds: [dmEmbed] }).catch(() => {
          console.log(`Could not send DM to ${banInfo.user.tag}`);
        });
      }
    } catch (err) {
      console.error(err);
      interaction.reply({
        content: "An error occurred while trying to unban the user.",
        ephemeral: true,
      });
    }
  },
};
