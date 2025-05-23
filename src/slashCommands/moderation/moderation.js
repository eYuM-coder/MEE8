const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const discord = require("discord.js");
const Logging = require("../../database/schemas/logging.js");
const Guild = require("../../database/schemas/Guild.js");
const logger = require("../../utils/logger.js");
const send = require("../../packages/logs/index.js");
const ms = require("ms");
const ReactionMenu = require("../../data/ReactionMenu.js");
const darkpassword = require("generate-password");
const randoStrings = require("../../packages/randostrings.js");
const random = new randoStrings();
const warnModel = require("../../database/models/moderation.js");
const fs = require("node:fs");
async function usePrettyMs(ms) {
  const { default: prettyMilliseconds } = await import("pretty-ms");
  const time = prettyMilliseconds(ms);
  return time;
}

function makehex(rgb) {
  var hex = Number(rgb).toString(16);
  if (hex.length < 2) {
    hex = "0" + hex;
  }
  return hex.padStart(6, "0");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("moderation")
    .setDescription("Moderation commands")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("clear")
        .setDescription("Clears a channels messages (limit: 10000)")
        .addStringOption((option) =>
          option
            .setName("amount")
            .setDescription("Amount of messages to clear")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName("reason").setDescription("The reason for the purge")
        )
        .addChannelOption((option) =>
          option.setName("channel").setDescription("The optional channel.")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("membercount")
        .setDescription("Displays the member count of the server.")
    )
    .addSubcommandGroup((group) =>
      group
        .setName("channel")
        .setDescription("Server moderation commands")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("lock")
            .setDescription("Locks a channel in the server")
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("The channel to lock")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("reason")
                .setDescription("The reason to lock the channel")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("overwritepermissions")
            .setDescription(
              "Overwrite permissions for a user or role in a channel"
            )
            .addStringOption((option) =>
              option
                .setName("permissions")
                .setDescription(
                  "The permissions to overwrite, separated by commas."
                )
                .setRequired(true)
            )
            .addBooleanOption((option) =>
              option
                .setName("allow")
                .setDescription(
                  "True to allow the permissions, false to deny them."
                )
                .setRequired(true)
            )
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription(
                  "The user whose permissions you want to overwrite"
                )
            )
            .addRoleOption((option) =>
              option
                .setName("role")
                .setDescription(
                  "The role whose permissions you want to overwrite"
                )
            )
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription(
                  "The channel where you want to overwrite permissions"
                )
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("unlock")
            .setDescription("Unlocks a channel in the server")
            .addChannelOption((option) =>
              option
                .setName("channel")
                .setDescription("The channel to unlock")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("reason")
                .setDescription("The reason to unlock the channel")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("slowmode")
            .setDescription(
              "Enables slowmode in a channel with the specified rate"
            )
            .addStringOption((option) =>
              option
                .setName("rate")
                .setDescription("The rate of messages/second")
                .setRequired(true)
            )
            .addChannelOption((option) =>
              option.setName("channel").setDescription("The channel")
            )
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName("user")
        .setDescription("User moderation commands")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("ban")
            .setDescription("Bans a user from the server.")
            .addUserOption((option) =>
              option
                .setName("member")
                .setDescription("The user to ban, if any.")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option.setName("reason").setDescription("The reason for the ban")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("kick")
            .setDescription("Kicks a user from the server.")
            .addUserOption((option) =>
              option
                .setName("member")
                .setDescription("The member you want to kick")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option.setName("reason").setDescription("The reason for the kick")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("modnick")
            .setDescription("Moderates a users nickname")
            .addUserOption((option) =>
              option
                .setName("member")
                .setDescription("The member to moderate the nickname of")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("reason")
                .setDescription("The reason for the moderation.")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("mute")
            .setDescription("Mutes a member in the server")
            .addUserOption((option) =>
              option
                .setName("member")
                .setDescription("The member to mute")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("reason")
                .setDescription("The reason for the mute.")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("removewarn")
            .setDescription("Removes a warning from a user")
            .addUserOption((option) =>
              option
                .setName("member")
                .setDescription("The member")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("warning")
                .setDescription("The warn ID")
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("setnickname")
            .setDescription("Changes the nickname of a provided user")
            .addUserOption((option) =>
              option
                .setName("member")
                .setDescription("The member to change the nickname of")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option.setName("nickname").setDescription("The nickname")
            )
            .addStringOption((option) =>
              option
                .setName("reason")
                .setDescription("The reason for the change")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("softban")
            .setDescription("Softbans a user")
            .addUserOption((option) =>
              option
                .setName("member")
                .setDescription("The member to softban")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option.setName("reason").setDescription("The reason")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("unban")
            .setDescription("Unban a person in the server!")
            .addStringOption((option) =>
              option
                .setName("member")
                .setDescription(
                  "Mention, tag, or ID of the person you want to unban"
                )
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("reason")
                .setDescription("The reason for the unban")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("unmute")
            .setDescription("Unmute a person in the server!")
            .addUserOption((option) =>
              option
                .setName("member")
                .setDescription("Person who you want to unmute.")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option.setName("reason").setDescription("The reason for unmuting")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
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
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("warnings")
            .setDescription("Shows the warnings for a user")
            .addUserOption((option) =>
              option.setName("member").setDescription("The member")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("warnpurge")
            .setDescription("Warns a user and removes their messages")
            .addUserOption((option) =>
              option
                .setName("member")
                .setDescription("The member to warn")
                .setRequired(true)
            )
            .addIntegerOption((option) =>
              option
                .setName("amount")
                .setDescription("The amount of messages to purge")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("reason")
                .setDescription("The reason to warn the user")
            )
        )
    )
    .addSubcommandGroup((roleGroup) =>
      roleGroup
        .setName("role")
        .setDescription("Role users with a specific role")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("info")
            .setDescription("Gets the information of a specified role.")
            .addRoleOption((option) =>
              option
                .setName("role")
                .setDescription("The role to get the information of")
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("all")
            .setDescription("Adds a role to all users.")
            .addRoleOption((option) =>
              option
                .setName("role")
                .setDescription("The role to add to the users.")
                .setRequired(true)
            )
            .addBooleanOption((option) =>
              option.setName("remove").setDescription("Remove role or not")
            )
            .addRoleOption((option) =>
              option
                .setName("inrole")
                .setDescription("Filter out members that are in this role")
            )
            .addStringOption((option) =>
              option
                .setName("reason")
                .setDescription("The reason for the role update.")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("bots")
            .setDescription("Adds a role to all bots.")
            .addRoleOption((option) =>
              option
                .setName("role")
                .setDescription("The role to add to the bots.")
                .setRequired(true)
            )
            .addBooleanOption((option) =>
              option.setName("remove").setDescription("Remove role or not")
            )
            .addStringOption((option) =>
              option
                .setName("reason")
                .setDescription("The reason for the role update.")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("humans")
            .setDescription("Adds a role to all humans.")
            .addRoleOption((option) =>
              option
                .setName("role")
                .setDescription("The role to add to the humans.")
                .setRequired(true)
            )
            .addBooleanOption((option) =>
              option.setName("remove").setDescription("Remove role or not")
            )
            .addRoleOption((option) =>
              option
                .setName("inrole")
                .setDescription("Filter out members that are in this role")
            )
            .addStringOption((option) =>
              option
                .setName("reason")
                .setDescription("The reason for the role update.")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("add")
            .setDescription("Adds a role to a user.")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("The user to add the role to.")
                .setRequired(true)
            )
            .addRoleOption((option) =>
              option
                .setName("role")
                .setDescription("The role to add.")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("reason")
                .setDescription("The reason for the role update.")
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("remove")
            .setDescription("Removes a role from a user.")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("The user to remove the role from.")
                .setRequired(true)
            )
            .addRoleOption((option) =>
              option
                .setName("role")
                .setDescription("The role to remove.")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("reason")
                .setDescription("The reason for the role update.")
            )
        )
    ),
  async execute(interaction) {
    const subcommandGroup = interaction.options.getSubcommandGroup(false);
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "clear") {
      try {
        await interaction.deferReply({ ephemeral: true });
        const logging = await Logging.findOne({
          guildId: interaction.guild.id,
        });

        const client = interaction.client;
        const fail = client.emoji.fail;
        const success = client.emoji.success;

        const amount = parseInt(interaction.options.getString("amount"));
        const channel =
          interaction.options.getChannel("channel") || interaction.channel;
        let reason = interaction.options.getString("reason");
        if (!reason) {
          reason = "No reason provided.";
        }
        if (reason.length > 1024) {
          reason = reason.slice(0, 1021) + "...";
        }

        if (isNaN(amount) || amount < 0 || amount > 10000) {
          let invalidamount = new MessageEmbed()
            .setAuthor({
              name: `${interaction.user.tag}`,
              iconURL: interaction.member.displayAvatarURL({ dynamic: true }),
            })
            .setTitle(`${fail} | Purge Error`)
            .setDescription(
              `Please provide a message count between 1 and 10000!`
            )
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
            const deletedMessages = await channel.bulkDelete(
              validMessages,
              true
            );

            totalDeleted += deletedMessages.size;

            logger.info(
              `Deleted ${deletedMessages.size} ${
                deletedMessages.size === 1 ? "message" : "messages"
              }.`,
              { label: "Purge" }
            );

            // If fewer than `messagesToFetch` were deleted, stop early
            if (deletedMessages.size < messagesToFetch) {
              break;
            } else if (
              deletedMessages.size !== 100 &&
              deletedMessages.size == messagesToFetch
            ) {
              break;
            }
          } catch (error) {
            logger.error(`Error deleting messages: ${error}`, {
              label: "ERROR",
            });
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
              .setDescription(
                `${success} | ***Found and purged ${totalDeleted} ${
                  totalDeleted === 1 ? "message" : "messages"
                }.* || ${reason}**`
              )
              .setColor(interaction.client.color.green);
            interaction.editReply({ embeds: [embed], ephemeral: true });
          } else {
            const embed = new MessageEmbed()

              .setDescription(
                `${success} | ***Successfully deleted ${totalDeleted} ${
                  totalDeleted === 1 ? "message" : "messages"
                }.* || ${reason}**`
              )

              .setColor(interaction.client.color.green);

            interaction.editReply({ embeds: [embed], ephemeral: true });
          }
        } else {
          const embed = new MessageEmbed()

            .setDescription(
              `${success} | ***Found and purged ${totalDeleted} ${
                totalDeleted === 1 ? "message" : "messages"
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
              if (
                interaction.channel.id !== logging.moderation.ignore_channel
              ) {
                if (
                  !role ||
                  (role &&
                    !interaction.member.roles.cache.find(
                      (r) => r.name.toLowerCase() === role.name
                    ))
                ) {
                  if (logging.moderation.purge == "true") {
                    let color = logging.moderation.color;
                    if (color == "#000000")
                      color = interaction.client.color.red;

                    let logcase = logging.moderation.caseN;
                    if (!logcase) logcase = `1`;

                    const logEmbed = new MessageEmbed()
                      .setAuthor({
                        name: `Action: \`Purge\` | Case #${logcase}`,
                        iconURL: interaction.member.displayAvatarURL({
                          format: "png",
                        }),
                      })
                      .addFields({
                        name: "Moderator",
                        value: `${interaction.member}`,
                        inline: true,
                      })
                      .setTimestamp()
                      .setFooter({
                        text: `Responsible ID: ${interaction.member.id}`,
                      })
                      .setColor(color);

                    send(
                      loggingChannel,
                      {
                        embeds: [logEmbed],
                      },
                      {
                        name: `${interaction.client.user.username}`,
                        username: `${interaction.client.user.username}`,
                        icon: interaction.client.user.displayAvatarURL({
                          dynamic: true,
                          format: "png",
                        }),
                      }
                    ).catch(() => {});

                    logging.moderation.caseN = logcase + 1;
                    await logging.save().catch(() => {});
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.log(err);
        interaction.editReply({
          content: "This command cannot be used in Direct Messages.",
          ephemeral: true,
        });
      }
    } else if (subcommand === "membercount") {
      const guildDB = await Guild.findOne({
        guildId: interaction.guild.id,
      });

      const members = interaction.guild.members.cache.size;

      const embed = new MessageEmbed()
        .setTitle(`Members`)
        .setFooter({
          text: interaction.user.tag,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setDescription(`${members}`)
        .setTimestamp()
        .setColor(interaction.guild.members.me.displayHexColor);

      return interaction.reply({ embeds: [embed] });
    }

    if (subcommandGroup === "role") {
      const subcommand = interaction.options.getSubcommand();
      try {
        if (!interaction.member.permissions.has("MANAGE_ROLES")) {
          return interaction.reply({
            content: `You do not have permission to use this command.`,
            ephemeral: true,
          });
        }
        const client = interaction.client;
        const fail = client.emoji.fail;
        const success = client.emoji.success;
        const logging = await Logging.findOne({
          guildId: interaction.guild.id,
        });

        if (subcommand === "info") {
          const role =
            interaction.options.getRole("role") ||
            interaction.guild.roles.cache.get(role) ||
            interaction.guild.roles.cache.find(
              (rl) =>
                rl.name.toLowerCase() === role.slice(1).join(" ").toLowerCase()
            );

          const keyPermissions = {
            ADMINISTRATOR: "Administrator",
            MANAGE_GUILD: "Manage Server",
            MANAGE_ROLES: "Manage Roles",
            MANAGE_CHANNELS: "Manage Channels",
            MANAGE_MESSAGES: "Manage Messages",
            MANAGE_WEBHOOKS: "Manage Webhooks",
            MANAGE_NICKNAMES: "Manage Nicknames",
            MANAGE_EMOJIS_AND_STICKERS: "Manage Emojis and Stickers",
            KICK_MEMBERS: "Kick Members",
            BAN_MEMBERS: "Ban Members",
            MENTION_EVERYONE: "Mention Everyone",
            MODERATE_MEMBERS: "Timeout Members",
          };

          // Get all role permissions as an array
          const rolePermissions = role.permissions.toArray();

          // Filter to only include key permissions & maintain the correct order
          const filteredPermissions = Object.keys(keyPermissions)
            .filter((perm) => rolePermissions.includes(perm)) // Check if the role has this permission
            .map((perm) => keyPermissions[perm]) // Convert to human-readable names
            .join(", "); // Format as a single line

          const embed = new MessageEmbed().addFields(
            { name: "ID", value: role.id, inline: true },
            { name: "Name", value: role.name, inline: true },
            {
              name: "Color",
              value: `${role.color != 0 ? `#` + makehex(role.color) : "None"}`,
              inline: true,
            },
            { name: "Mention", value: `\`${role}\``, inline: true },
            { name: "Hoisted", value: role.hoist ? "Yes" : "No", inline: true },
            { name: "Position", value: role.position.toString(), inline: true },
            {
              name: "Mentionable",
              value: role.mentionable ? "Yes" : "No",
              inline: true,
            },
            {
              name: "Managed",
              value: role.managed ? "Yes" : "No",
              inline: true,
            },
            {
              name: "Key Permissions",
              value:
                filteredPermissions.length > 0 ? filteredPermissions : "None",
            }
          )
          .setColor(`${`#` + makehex(role.color)}`);

          interaction.reply({ embeds: [embed] });
        } else if (subcommand === "all") {
          const role =
            interaction.options.getRole("role") ||
            interaction.guild.roles.cache.get(role) ||
            interaction.guild.roles.cache.find(
              (rl) =>
                rl.name.toLowerCase() === role.slice(1).join(" ").toLowerCase()
            );
          const removerole = interaction.options.getBoolean("remove") || false;
          let inrole = interaction.options.getRole("inrole");
          let inroleoptionspecified;
          let inroleoptionnotspecified;
          if (inrole) {
            inroleoptionspecified = true;
            inroleoptionnotspecified = false;
          } else {
            inroleoptionspecified = false;
            inroleoptionnotspecified = true;
            inrole = interaction.guild.roles.cache.find(
              (role) => role.name === "@everyone"
            );
          }

          let reason = interaction.options.getString("reason");
          if (!reason) {
            reason = removerole ? `Role Remove` : `Role Add`;
          }
          if (reason.length > 1024) reason = reason.slice(0, 1021) + "...";

          if (!role) {
            let rolenotfound = new MessageEmbed()
              .setAuthor({
                name: `${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
              })
              .setDescription(`${fail} | Please provide a valid role!`)
              .setTimestamp()
              .setFooter({
                text: "https://neonova.eyum.org",
              })
              .setColor(interaction.client.color.red);
            return interaction.reply({
              embeds: [rolenotfound],
              ephmeral: true,
            });
          } else {
            let members;
            if (removerole === false) {
              members = interaction.guild.members.cache.filter(
                (member) =>
                  !member.roles.cache.has(role.id) &&
                  (inroleoptionspecified || inroleoptionnotspecified) &&
                  member.roles.cache.has(inrole.id)
              );
              let memberstoaddroleto = members.size;
              await interaction
                .reply({
                  embeds: [
                    new MessageEmbed()
                      .setDescription(
                        `${success} | Adding ${role} to ${memberstoaddroleto} ${
                          memberstoaddroleto === 1 ? "member" : "members"
                        }. This may take a while!`
                      )
                      .setColor(interaction.client.color.green),
                  ],
                })
                .then(async () => {
                  await members.forEach(
                    async (member) =>
                      await member.roles.add(role, [
                        `${reason} / Responsible User: ${interaction.user.tag}, Reason: ${reason}`,
                      ])
                  );
                })
                .then(() => {
                  const embed = new MessageEmbed()
                    .setDescription(
                      `${success} | Added **${role}** to **${memberstoaddroleto}** ${
                        memberstoaddroleto === 1 ? "member" : "members"
                      }.`
                    )
                    .setColor(interaction.client.color.green);
                  interaction
                    .editReply({ embeds: [embed] })
                    .then(async () => {
                      if (
                        logging &&
                        logging.moderation.delete_reply === "true"
                      ) {
                        setTimeout(() => {
                          interaction.deleteReply().catch(() => {});
                        }, 5000);
                      }
                    })
                    .catch(() => {});
                });
            } else {
              members = interaction.guild.members.cache.filter(
                (member) =>
                  member.roles.cache.has(role.id) &&
                  (inroleoptionspecified || inroleoptionnotspecified) &&
                  member.roles.cache.has(inrole.id)
              );
              let memberstoaddroleto = members.size;
              interaction
                .reply({
                  embeds: [
                    new MessageEmbed()
                      .setDescription(
                        `${success} | Removing ${role} from ${memberstoaddroleto} ${
                          memberstoaddroleto === 1 ? "member" : "members"
                        }. This may take a while!`
                      )
                      .setColor(interaction.client.color.green),
                  ],
                })
                .then(async () => {
                  await members.forEach(
                    async (member) =>
                      await member.roles.remove(role, [
                        `${reason} / Responsible User: ${interaction.user.tag}`,
                      ])
                  );
                })
                .then(() => {
                  const embed = new MessageEmbed()
                    .setDescription(
                      `${success} | Removed **${role}** from **${memberstoaddroleto}** ${
                        memberstoaddroleto === 1 ? "member" : "members"
                      }.`
                    )
                    .setColor(interaction.client.color.green);
                  interaction
                    .editReply({ embeds: [embed] })
                    .then(async () => {
                      if (
                        logging &&
                        logging.moderation.delete_reply === "true"
                      ) {
                        setTimeout(() => {
                          interaction.deleteReply().catch(() => {});
                        }, 5000);
                      }
                    })
                    .catch(() => {});
                });
            }
          }
        } else if (subcommand === "bots") {
          const role =
            interaction.options.getRole("role") ||
            interaction.guild.roles.cache.get(role) ||
            interaction.guild.roles.cache.find(
              (rl) =>
                rl.name.toLowerCase() === role.slice(1).join(" ").toLowerCase()
            );
          const removerole = interaction.options.getBoolean("remove") || false;

          let reason = interaction.options.getString("reason");
          if (!reason) {
            reason = removerole ? `Role Remove` : `Role Add`;
          }
          if (reason.length > 1024) {
            reason = reason.slice(0, 1021) + "...";
          }

          if (!role) {
            let rolenotfound = new MessageEmbed()
              .setAuthor({
                name: `${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
              })
              .setDescription(`${fail} | Please provide a valid role!`)
              .setTimestamp()
              .setFooter({
                text: "https://neonova.eyum.org",
              })
              .setColor(interaction.client.color.red);
            return interaction.reply({
              embeds: [rolenotfound],
              ephmeral: true,
            });
          } else {
            let members;
            if (removerole === false) {
              members = interaction.guild.members.cache.filter(
                (member) => member.user.bot && !member.roles.cache.has(role.id)
              );
              let memberstoaddroleto = members.size;
              interaction
                .reply({
                  embeds: [
                    new MessageEmbed()
                      .setDescription(
                        `${success} | Adding ${role} to ${memberstoaddroleto} bots. This may take a while!`
                      )
                      .setColor(interaction.client.color.green),
                  ],
                })
                .then(async () => {
                  await members.forEach(
                    async (member) =>
                      await member.roles.add(role, [
                        `${reason} / Responsible User: ${interaction.user.tag}`,
                      ])
                  );
                })
                .then(() => {
                  const embed = new MessageEmbed()
                    .setDescription(
                      `${success} | Added **${role}** to **${memberstoaddroleto}** ${
                        memberstoaddroleto === 1 ? "bot" : "bots"
                      }.`
                    )
                    .setColor(interaction.client.color.green);
                  interaction
                    .editReply({ embeds: [embed] })
                    .then(async () => {
                      if (
                        logging &&
                        logging.moderation.delete_reply === "true"
                      ) {
                        setTimeout(() => {
                          interaction.deleteReply().catch(() => {});
                        }, 5000);
                      }
                    })
                    .catch(() => {});
                });
            } else {
              members = interaction.guild.members.cache.filter(
                (member) => member.user.bot && member.roles.cache.has(role.id)
              );
              let memberstoaddroleto = members.size;
              interaction
                .reply({
                  embeds: [
                    new MessageEmbed()
                      .setDescription(
                        `${success} | Removing ${role} from ${memberstoaddroleto} ${
                          memberstoaddroleto === 1 ? "bot" : "bots"
                        }. This may take a while!`
                      )
                      .setColor(interaction.client.color.green),
                  ],
                })
                .then(async () => {
                  await members.forEach(
                    async (member) =>
                      await member.roles.remove(role, [
                        `${reason} / Responsible User: ${interaction.user.tag}`,
                      ])
                  );
                })
                .then(() => {
                  const embed = new MessageEmbed()
                    .setDescription(
                      `${success} | Removed **${role}** from **${memberstoaddroleto}** ${
                        memberstoaddroleto === 1 ? "bot" : "bots"
                      }`
                    )
                    .setColor(interaction.client.color.green);
                  interaction
                    .editReply({ embeds: [embed] })
                    .then(async () => {
                      if (
                        logging &&
                        logging.moderation.delete_reply === "true"
                      ) {
                        setTimeout(() => {
                          interaction.deleteReply().catch(() => {});
                        }, 5000);
                      }
                    })
                    .catch(() => {});
                });
            }
          }
        } else if (subcommand === "humans") {
          const role =
            interaction.options.getRole("role") ||
            interaction.guild.roles.cache.get(role) ||
            interaction.guild.roles.cache.find(
              (rl) =>
                rl.name.toLowerCase() === role.slice(1).join(" ").toLowerCase()
            );
          const removerole = interaction.options.getBoolean("remove") || false;
          const inrole = interaction.options.getRole("inrole");
          let inroleoptionspecified;
          let inroleoptionnotspecified;
          if (inrole) {
            inroleoptionspecified = true;
            inroleoptionnotspecified = false;
          } else {
            inroleoptionspecified = false;
            inroleoptionnotspecified = true;
          }

          let reason = interaction.options.getString("reason");
          if (!reason) {
            reason = removerole ? `Role Remove` : `Role Add`;
          }
          if (reason.length > 1024) {
            reason = reason.slice(0, 1021) + "...";
          }

          if (!role) {
            let rolenotfound = new MessageEmbed()
              .setAuthor({
                name: `${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
              })
              .setDescription(`${fail} | Please provide a valid role!`)
              .setTimestamp()
              .setFooter({
                text: "https://neonova.eyum.org",
              })
              .setColor(interaction.client.color.red);
            return interaction.reply({
              embeds: [rolenotfound],
              ephmeral: true,
            });
          } else {
            let members;
            if (removerole === false) {
              members = interaction.guild.members.cache.filter(
                (member) =>
                  !member.user.bot &&
                  !member.roles.cache.has(role.id) &&
                  (inroleoptionspecified || inroleoptionnotspecified) &&
                  member.roles.cache.has(inrole.id)
              );
              interaction
                .reply({
                  embeds: [
                    new MessageEmbed()
                      .setDescription(
                        `${success} | Adding ${role.name} to ${members.size} ${
                          members.size === 1 ? "human" : "humans"
                        }. This may take a while!`
                      )
                      .setColor(interaction.client.color.green),
                  ],
                })
                .then(async () => {
                  await members.forEach(
                    async (member) =>
                      await member.roles.add(role, [
                        `${reason} / Responsible User: ${interaction.user.tag}`,
                      ])
                  );
                })
                .then(() => {
                  const embed = new MessageEmbed()
                    .setDescription(
                      `${success} | Added **${role}** to **${members.size}** ${
                        members.size === 1 ? "human" : "humans"
                      }.`
                    )
                    .setColor(interaction.client.color.green);
                  interaction
                    .editReply({ embeds: [embed] })
                    .then(async () => {
                      if (
                        logging &&
                        logging.moderation.delete_reply === "true"
                      ) {
                        setTimeout(() => {
                          interaction.deleteReply().catch(() => {});
                        }, 5000);
                      }
                    })
                    .catch(() => {});
                });
            } else {
              members = interaction.guild.members.cache.filter(
                (member) =>
                  !member.user.bot &&
                  member.roles.cache.has(role.id) &&
                  (inroleoptionspecified || inroleoptionnotspecified) &&
                  member.roles.cache.has(inrole.id)
              );
              interaction
                .reply({
                  embeds: [
                    new MessageEmbed()
                      .setDescription(
                        `${success} | Removing ${role.name} from ${
                          members.size
                        } ${
                          members.size === 1 ? "human" : "humans"
                        }. This may take a while!`
                      )
                      .setColor(interaction.client.color.green),
                  ],
                })
                .then(async () => {
                  await members.forEach(
                    async (member) =>
                      await member.roles.remove(role, [
                        `${reason} / Responsible User: ${interaction.user.tag}`,
                      ])
                  );
                })
                .then(() => {
                  const embed = new MessageEmbed()
                    .setDescription(
                      `${success} | Removed **${role}** from **${
                        members.size
                      }** ${members.size === 1 ? "human" : "humans"}.`
                    )
                    .setColor(interaction.client.color.green);
                  interaction
                    .editReply({ embeds: [embed] })
                    .then(async () => {
                      if (
                        logging &&
                        logging.moderation.delete_reply === "true"
                      ) {
                        setTimeout(() => {
                          interaction.deleteReply().catch(() => {});
                        }, 5000);
                      }
                    })
                    .catch(() => {});
                });
            }
          }
        } else if (subcommand === "add") {
          const member = interaction.options.getMember("user");
          const role =
            interaction.options.getRole("role") ||
            interaction.guild.roles.cache.get(role) ||
            interaction.guild.roles.cache.find(
              (rl) =>
                rl.name.toLowerCase() === role.slice(1).join(" ").toLowerCase()
            );
          let reason = interaction.options.getString("reason");
          if (!reason) {
            reason = `Role Add`;
          }
          if (reason.length > 1024) {
            reason = reason.slice(0, 1021) + "...";
          }

          if (!role) {
            let rolenotfound = new MessageEmbed()
              .setAuthor({
                name: `${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
              })
              .setDescription(`${fail} | Please provide a valid role!`)
              .setTimestamp()
              .setFooter({
                text: "https://neonova.eyum.org",
              })
              .setColor(interaction.client.color.red);
            return interaction.reply({
              embeds: [rolenotfound],
              ephmeral: true,
            });
          } else {
            if (member.roles.cache.has(role.id)) {
              let alreadyhasrole = new MessageEmbed()
                .setAuthor({
                  name: `${interaction.user.tag}`,
                  iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                })
                .setDescription(
                  `${fail} | ${member} already has the role ${role}.`
                )
                .setTimestamp()
                .setFooter({
                  text: "https://neonova.eyum.org",
                })
                .setColor(interaction.client.color.red);
              return interaction.reply({
                embeds: [alreadyhasrole],
                ephmeral: true,
              });
            } else {
              member.roles
                .add(role, [
                  `${reason} / Responsible User: ${interaction.user.tag}`,
                ])
                .then(() => {
                  const embed = new MessageEmbed()
                    .setDescription(`${success} | Added ${role} to ${member}.`)
                    .setColor(interaction.client.color.green);
                  interaction
                    .reply({ embeds: [embed] })
                    .then(async () => {
                      if (
                        logging &&
                        logging.moderation.delete_reply === "true"
                      ) {
                        setTimeout(() => {
                          interaction.deleteReply().catch(() => {});
                        }, 5000);
                      }
                    })
                    .catch(() => {});
                })
                .catch(() => {
                  let botrolepossiblylow = new MessageEmbed()
                    .setAuthor({
                      name: `${interaction.user.tag}`,
                      iconURL: interaction.user.displayAvatarURL({
                        dynamic: true,
                      }),
                    })
                    .setDescription(
                      `${fail} | The role is possibly higher than me or you. Please move my role above the role and try again!`
                    )
                    .setTimestamp()
                    .setFooter({
                      text: "https://neonova.eyum.org",
                    })
                    .setColor(interaction.client.color.red);
                  return interaction.reply({
                    embeds: [botrolepossiblylow],
                    ephmeral: true,
                  });
                });
            }
          }
        } else if (subcommand === "remove") {
          let member = interaction.options.getMember("user");
          let role =
            interaction.options.getRole("role") ||
            interaction.guild.roles.cache.get(role) ||
            interaction.guild.roles.cache.find(
              (rl) =>
                rl.name.toLowerCase() === role.slice(1).join(" ").toLowerCase()
            );
          let reason = interaction.options.getString("reason");
          if (!reason) {
            reason = `Role Remove`;
          }
          if (reason.length > 1024) {
            reason = reason.slice(0, 1021) + "...";
          }

          if (!role) {
            const rolenotfound = new MessageEmbed()
              .setAuthor({
                name: `${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
              })
              .setDescription(`${fail} | Please provide a valid role!`)
              .setTimestamp()
              .setFooter({
                text: "https://neonova.eyum.org",
              })
              .setColor(interaction.client.color.red);
            return interaction.reply({
              embeds: [rolenotfound],
              ephemeral: true,
            });
          } else {
            if (!member.roles.cache.has(role.id)) {
              const nothasrole = new MessageEmbed()
                .setAuthor({
                  name: `${interaction.user.tag}`,
                  iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                })
                .setDescription(
                  `${fail} | ${member} doesn't have the role ${role}!`
                )
                .setTimestamp()
                .setFooter({
                  text: "https://neonova.eyum.org",
                })
                .setColor(interaction.client.color.red);
              return interaction.reply({
                embeds: [nothasrole],
                ephemeral: true,
              });
            } else {
              member.roles
                .remove(role, [
                  `${reason} / Responsible User: ${interaction.user.tag}`,
                ])
                .then(() => {
                  const embed = new MessageEmbed()
                    .setDescription(
                      `${success} | Removed ${role} from ${member}.`
                    )
                    .setColor(interaction.client.color.green);
                  interaction
                    .reply({ embeds: [embed] })
                    .then(() => {
                      if (
                        logging &&
                        logging.moderation.delete_reply === "true"
                      ) {
                        setTimeout(() => {
                          interaction.deleteReply().catch(() => {});
                        }, 5000);
                      }
                    })
                    .catch(() => {});
                })
                .catch(() => {
                  let botrolepossiblylow = new MessageEmbed()
                    .setAuthor({
                      name: `${interaction.user.tag}`,
                      iconURL: interaction.user.displayAvatarURL({
                        dynamic: true,
                      }),
                    })
                    .setDescription(
                      `${fail} | The role is possibly higher than me or you. Please move my role above the role and try again.`
                    )
                    .setTimestamp()
                    .setFooter({
                      text: `https://neonova.eyum.org`,
                    })
                    .setColor(interaction.client.color.red);
                  return interaction.reply({
                    embeds: [botrolepossiblylow],
                    ephemeral: true,
                  });
                });
            }
          }
        }
      } catch (error) {
        console.log(error);
        const fail = interaction.client.emoji.fail;
        let botrolepossiblylow = new MessageEmbed()
          .setAuthor({
            name: `${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          })
          .setDescription(
            `${fail} | This role is a(n) mod/admin role, I can't do that.`
          )
          .setTimestamp()
          .setFooter({
            text: `https://neonova.eyum.org`,
          })
          .setColor(interaction.client.color.red);
        return interaction.reply({
          embeds: [botrolepossiblylow],
          ephemeral: true,
        });
      }
    } else if (subcommandGroup === "channel") {
      if (subcommand === "lock") {
        try {
          const client = interaction.client;
          const fail = interaction.client.emoji.fail;
          const success = interaction.client.emoji.success;

          const logging = await Logging.findOne({
            guildId: interaction.guild.id,
          });
          const guildDB = await Guild.findOne({
            guildId: interaction.guild.id,
          });
          const language = require(`../../data/language/${guildDB.language}.json`);
          let channel = interaction.options.getChannel("channel");
          let reason = interaction.options.getString("reason");

          if (channel) {
            reason = reason || "`none`";
          } else channel = interaction.channel;

          if (
            channel
              .permissionsFor(interaction.guild.id)
              .has("SEND_MESSAGES") === false
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
            .edit(interaction.guild.members.me, { SEND_MESSAGES: true })
            .catch(() => {});

          channel.permissionOverwrites
            .edit(interaction.guild.id, { SEND_MESSAGES: false })
            .catch(() => {});

          channel.permissionOverwrites
            .edit(interaction.member.id, { SEND_MESSAGES: true })
            .catch(() => {});

          const embed = new MessageEmbed()
            .setDescription(
              `${success} | Successfully locked **${channel}** ${
                logging && logging.moderation.include_reason === "true"
                  ? `\n\n**Reason:** ${reason}`
                  : ``
              }`
            )
            .setColor(client.color.green);
          interaction
            .reply({ embeds: [embed] })
            .then(() => {
              if (logging && logging.moderation.delete_reply === "true") {
                setTimeout(() => {
                  interaction.deleteReply().catch(() => {});
                }, 5000);
              }
            })
            .catch(() => {});

          if (logging) {
            if (logging.moderation.delete_after_executed === "true") {
              interaction.delete().catch(() => {});
            }

            const role = interaction.guild.roles.cache.get(
              logging.moderation.ignore_role
            );
            const channel = interaction.guild.channels.cache.get(
              logging.moderation.channel
            );

            if (logging.moderation.toggle == "true") {
              if (channel) {
                if (
                  interaction.channel.id !== logging.moderation.ignore_channel
                ) {
                  if (
                    !role ||
                    (role &&
                      !interaction.member.roles.cache.find(
                        (r) => r.name.toLowerCase() === role.name
                      ))
                  ) {
                    if (logging.moderation.lock == "true") {
                      let color = logging.moderation.color;
                      if (color == "#000000")
                        color = interaction.client.color.red;

                      let logcase = logging.moderation.caseN;
                      if (!logcase) logcase = `1`;

                      let reason = interaction.options.getString("reason");
                      if (!reason) reason = `${language.noReasonProvided}`;
                      if (reason.length > 1024)
                        reason = reason.slice(0, 1021) + "...";

                      const logEmbed = new MessageEmbed()
                        .setAuthor({
                          name: `Action: \`Lock\` | ${interaction.user.tag} | Case #${logcase}`,
                          iconURL: interaction.user.displayAvatarURL({
                            format: "png",
                          }),
                        })
                        .addFields(
                          {
                            name: "Channel",
                            value: `${channel}`,
                            inline: true,
                          },
                          {
                            name: "Moderator",
                            value: `${interaction.user}`,
                            inline: true,
                          },
                          { name: "Reason", value: `${reason}`, inline: true }
                        )
                        .setFooter({ text: `ID: ${interaction.user.id}` })
                        .setTimestamp()
                        .setColor(color);

                      send(
                        channel,
                        {
                          embeds: [logEmbed],
                        },
                        {
                          name: `${interaction.client.user.username}`,
                          username: `${interaction.client.user.username}`,
                          icon: interaction.client.user.displayAvatarURL({
                            dynamic: true,
                            format: "png",
                          }),
                        }
                      ).catch(() => {});

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
      } else if (subcommand === "unlock") {
        try {
          const client = interaction.client;
          const fail = interaction.client.emoji.fail;
          const success = interaction.client.emoji.success;

          const logging = await Logging.findOne({
            guildId: interaction.guild.id,
          });
          const guildDB = await Guild.findOne({
            guildId: interaction.guild.id,
          });
          const language = require(`../../data/language/${guildDB.language}.json`);
          let channel = interaction.options.getChannel("channel");
          let reason = interaction.options.getString("reason");

          if (channel) {
            reason = reason || "`none`";
          } else channel = interaction.channel;

          if (
            channel
              .permissionsFor(interaction.guild.id)
              .has("SEND_MESSAGES") === true
          ) {
            const lockchannelError2 = new MessageEmbed()
              .setDescription(`${fail} | ${channel} is already unlocked`)
              .setColor(client.color.red);
            return interaction.reply({
              embeds: [lockchannelError2],
              ephemeral: true,
            });
          }

          channel.permissionOverwrites
            .edit(interaction.guild.members.me, { SEND_MESSAGES: true })
            .catch(() => {});

          channel.permissionOverwrites
            .edit(interaction.guild.id, { SEND_MESSAGES: true })
            .catch(() => {});

          channel.permissionOverwrites
            .edit(interaction.member.id, { SEND_MESSAGES: true })
            .catch(() => {});

          const embed = new MessageEmbed()
            .setDescription(
              `${success} | Successfully unlocked **${channel}** ${
                logging && logging.moderation.include_reason === "true"
                  ? `\n\n**Reason:** ${reason}`
                  : ``
              }`
            )
            .setColor(client.color.green);
          interaction
            .reply({ embeds: [embed] })
            .then(() => {
              if (logging && logging.moderation.delete_reply === "true") {
                setTimeout(() => {
                  interaction.deleteReply().catch(() => {});
                }, 5000);
              }
            })
            .catch(() => {});
        } catch (err) {
          console.error(err);
          interaction.reply({
            content: "This command cannot be used in Direct Messages.",
            ephemeral: true,
          });
        }
      } else if (subcommand === "slowmode") {
        try {
          if (!interaction.member.permissions.has("MANAGE_CHANNELS")) {
            return interaction.reply({
              content: "You do not have permission to use this command.",
              ephemeral: true,
            });
          }
          const client = interaction.client;
          const fail = client.emoji.fail;
          const success = client.emoji.success;

          const logging = await Logging.findOne({
            guildId: interaction.guild.id,
          });
          const guildDB = await Guild.findOne({
            guildId: interaction.guild.id,
          });
          const language = require(`../../data/language/${guildDB.language}.json`);

          let index = 1;
          let channel = interaction.options.getChannel("channel");
          if (!channel) {
            channel = interaction.channel;
            index--;
          }

          if (channel.type != "GUILD_TEXT" || !channel.viewable) {
            let channelerror = new MessageEmbed()
              .setAuthor({
                name: `${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
              })
              .setDescription(`${fail} | I can't view the provided channel!`)
              .setTimestamp()
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
              .setColor(interaction.guild.members.me.displayHexColor);
            return interaction
              .reply({ embeds: [channelerror] })
              .then(async () => {
                if (logging && logging.moderation.delete_reply === "true") {
                  setTimeout(() => {
                    interaction.deleteReply().catch(() => {});
                  }, 5000);
                }
              })
              .catch(() => {});
          }

          const rate = ms(interaction.options.getString("rate"));
          console.log(rate);
          if (isNaN(rate) || rate < 0 || rate > 21600000) {
            let embed = new MessageEmbed()
              .setAuthor({
                name: `${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
              })
              .setDescription(
                `${fail} | Please provide a rate limit between 0 seconds and 6 hours.`
              )
              .setTimestamp()
              .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
              .setColor(interaction.guild.members.me.displayHexColor);
            return interaction
              .reply({ embeds: [embed] })
              .then(async () => {
                if (logging && logging.moderation.delete_reply === "true") {
                  setTimeout(() => {
                    interaction.deleteReply().catch(() => {});
                  }, 5000);
                }
              })
              .catch(() => {});
          }

          await channel.setRateLimitPerUser(rate / 1000);

          if (rate === 0) {
            return interaction
              .reply({
                embeds: [
                  new MessageEmbed()
                    .setDescription(
                      `${success} | Slow Mode has been disabled, good luck!`
                    )
                    .setColor(interaction.guild.members.me.displayHexColor),
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
            interaction
              .reply({
                embeds: [
                  new MessageEmbed()
                    .setDescription(
                      `${success} | Slow Mode was successfully set to **1 msg/${ms(
                        rate,
                        { long: false }
                      )}**`
                    )
                    .setColor(interaction.guild.members.me.displayHexColor),
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
          }
        } catch (err) {
          console.error(err);
          interaction.reply({
            content: "This command cannot be used in Direct Messages.",
            ephemeral: true,
          });
        }
      } else if (subcommand === "overwritepermissions") {
        const permissionsData = JSON.parse(
          fs.readFileSync(
            "./src/assets/json/serializedPermissions.json",
            "utf-8"
          )
        );
        const channel =
          interaction.options.getChannel("channel") || interaction.channel;
        const user = interaction.options.getMember("user");
        const role = interaction.options.getRole("role");
        const serializedPermissions = interaction.options
          .getString("permissions")
          .split(",")
          .map((p) => p.trim());
        const allow = interaction.options.getBoolean("allow");

        if (
          !(
            channel instanceof discord.TextChannel ||
            channel instanceof discord.VoiceChannel
          )
        ) {
          return interaction.reply({
            content:
              "You can only overwrite permissions for text or voice channels.",
            ephemeral: true,
          });
        }

        let permissionUpdates = {};
        serializedPermissions.forEach((number) => {
          if (permissionsData[number]) {
            permissionUpdates[permissionsData[number]] = allow;
          }
        });

        if (Object.keys(permissionUpdates).length === 0) {
          return interaction.reply("No valid permissions were provided.");
        }

        try {
          if (user) {
            await channel.permissionOverwrites.edit(user.id, permissionUpdates);
            return interaction.reply(
              `Successfully updated permissions for ${user.tag} in ${channel.name}.`
            );
          }

          if (role) {
            await channel.permissionOverwrites.edit(role.id, permissionUpdates);
            return interaction.reply(
              `Successfully updated permissions for the role ${role.name} in ${channel.name}.`
            );
          }

          return interaction.reply(
            "Please provide a user or role to overwrite permissions for."
          );
        } catch (error) {
          console.error(error);
          return interaction.reply(
            "There was an error while processing the command."
          );
        }
      }
    } else if (subcommandGroup === "user") {
      if (subcommand === "ban") {
        try {
          if (!interaction.member.permissions.has("BAN_MEMBERS")) {
            return interaction.reply({
              content: "You do not have permission to use this command.",
              ephemeral: true,
            });
          }

          const client = interaction.client;
          const guildDb = await Guild.findOne({
            guildId: interaction.guild.id,
          });
          const logging = await Logging.findOne({
            guildId: interaction.guild.id,
          });
          const language = require(`../../data/language/${guildDb.language}.json`);

          const targetUser = interaction.options.getUser("member");
          if (!targetUser) {
            return interaction.reply({
              content: "User not found.",
              ephemeral: true,
            });
          }

          if (targetUser.id === interaction.user.id) {
            return interaction.reply({
              content: `${client.emoji.fail} | ${language.banYourselfError}!`,
              ephemeral: true,
            });
          }

          let reason =
            interaction.options.getString("reason") || "No reason provided.";
          if (reason.length > 512) reason = reason.slice(0, 509) + "...";

          // **DM the user before banning**
          let dmEmbed;
          if (
            logging &&
            logging.moderation.ban_action &&
            logging.moderation.ban_message.toggle === "false" &&
            logging.moderation.ban_action !== "1"
          ) {
            if (logging.moderation.ban_action === "2") {
              dmEmbed = `${interaction.client.emoji.fail} You've been banned in **${interaction.guild.name}**`;
            } else if (logging.moderation.ban_action === "3") {
              dmEmbed = `${interaction.client.emoji.fail} You've been banned in **${interaction.guild.name}**. | ${reason}`;
            } else if (logging.moderation.ban_action === "4") {
              dmEmbed = `${interaction.client.emoji.fail} You've been banned in **${interaction.guild.name}**. | ${reason}\n\n-# __**Moderator:**__ ${interaction.user} (${interaction.user.tag})`;
            }

            targetUser
              .send({
                embeds: [
                  new MessageEmbed()
                    .setColor(interaction.client.color.red)
                    .setDescription(dmEmbed),
                ],
              })
              .catch(() => {});
          }

          try {
            await targetUser.send({ embeds: [dmEmbed] });
          } catch {
            console.log(`Could not send DM to ${targetUser.tag}.`);
          }

          // **Ban the user**
          const response = await interaction.guild.bans
            .create(targetUser.id, { reason })
            .catch(() => null);

          if (response) {
            const banEmbed = new MessageEmbed()
              .setColor("GREEN")
              .setDescription(
                `${client.emoji.success} | **${targetUser.tag}** has been banned.\n**Reason:** ${reason}`
              );

            interaction.reply({ embeds: [banEmbed] }).then(async () => {
              if (logging && logging.moderation.delete_reply === "true") {
                setTimeout(() => {
                  interaction.deleteReply().catch(() => {});
                }, 5000);
              }
            });

            // **Logging System**
            if (logging) {
              const logChannel = interaction.guild.channels.cache.get(
                logging.moderation.channel
              );
              if (logging.moderation.toggle === "true" && logChannel) {
                const logEmbed = new MessageEmbed()
                  .setTitle("User Banned")
                  .setColor("RED")
                  .addFields(
                    {
                      name: "User",
                      value: `${targetUser.tag} (${targetUser.id})`,
                      inline: true,
                    },
                    {
                      name: "Moderator",
                      value: `${interaction.user.tag}`,
                      inline: true,
                    },
                    { name: "Reason", value: reason, inline: true }
                  )
                  .setTimestamp();

                send(
                  logChannel,
                  { embeds: [logEmbed] },
                  {
                    name: `${interaction.client.user.username}`,
                    username: `${interaction.client.user.username}`,
                    icon: interaction.client.user.displayAvatarURL({
                      dynamic: true,
                      format: "png",
                    }),
                  }
                ).catch(console.error);
              }
            }
          } else {
            return interaction.reply({
              emmbeds: [
                new MessageEmbed().setDescription(
                  `${client.emoji.fail} | That user is a mod/admin, I can't do that.`
                ),
              ],
              ephemeral: true,
            });
          }
        } catch (err) {
          console.error(err);
          interaction.reply({
            embeds: [
              new MessageEmbed().setDescription(
                `${client.emoji.fail} | That user is a mod/admin, I can't do that.`
              ),
            ],
            ephemeral: true,
          });
        }
      } else if (subcommand === "kick") {
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
              .setDescription(
                `${client.emoji.fail} | I can't find that member`
              );
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
              .setDescription(
                `${client.emoji.fail} | You can't kick yourself!`
              );
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
                `${client.emoji.success} ***${member} was kicked.*** | ${
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
                `${client.emoji.fail} | That user is a mod/admin, I can't do that.`
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
                if (
                  interaction.channel.id !== logging.moderation.ignore_channel
                ) {
                  if (
                    !role ||
                    (role &&
                      !interaction.member.roles.cache.find(
                        (r) => r.name.toLowerCase() === role.name
                      ))
                  ) {
                    if (logging.moderation.kick == "true") {
                      let color = logging.moderation.color;
                      if (color == "#000000")
                        color = interaction.client.color.red;

                      let logcase = logging.moderation.caseN;
                      if (!logcase) logcase = `1`;

                      let reason = interaction.options.getString("reason");
                      if (!reason) reason = `${language.noReasonProvided}`;
                      if (reason.length > 1024)
                        reason = reason.slice(0, 1021) + "...";

                      const logEmbed = new MessageEmbed()
                        .setAuthor({
                          name: `Action: \`Kick\` | ${member.user.tag} | Case #${logcase}`,
                          iconURL: member.user.displayAvatarURL({
                            format: "png",
                          }),
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

                      send(
                        channel,
                        { embeds: [logEmbed] },
                        {
                          name: `${interaction.client.user.username}`,
                          username: `${interaction.client.user.username}`,
                          icon: interaction.client.user.displayAvatarURL({
                            dynamic: true,
                            format: "png",
                          }),
                        }
                      ).catch(() => {});

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
      } else if (subcommand === "modnick") {
        try {
          const client = interaction.client;
          const logging = await Logging.findOne({
            guildId: interaction.guild.id,
          });

          const member = interaction.options.getMember("member");
          const reason =
            interaction.options.getString("reason") || "No reason Provided";

          const impostorpassword =
            Math.random().toString(36).substring(2, 5) +
            Math.random().toString(36).substring(2, 5);

          if (!interaction.member.permissions.has("MANAGE_NICKNAMES"))
            return interaction.followUp({
              content: "You do not have permission to use this command.",
            });

          if (!member) {
            let validmention = new MessageEmbed()
              .setColor("RED")
              .setDescription(
                `${client.emoji.fail} | Please mention a valid member!`
              );
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
          if (member === interaction.author) {
            let modnickerror = new MessageEmbed()
              .setColor("RED")
              .setDescription(
                `${client.emoji.fail} | You can't moderate your own nickname!`
              );
            return interaction
              .reply({ embeds: [modnickerror] })

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
            const oldNickname = member.nickname || "None";
            await member.setNickname(`Moderated Nickname ${impostorpassword}`);
            let embed = new MessageEmbed()
              .setColor("BLURPLE")
              .setDescription(
                `${client.emoji.success} | Moderated ${member}'s nickname for \`${reason}\``
              );
            return interaction
              .reply({ embeds: [embed] })
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
                `**Nickname Moderated**\nYour nickname was moderated in **${interaction.guild.name}**. If you would like to change your nickname to something else, please reach out to a staff member.\n**Possible Reasons**\n• Your name was not typeable on a standard English QWERTY keyboard.\n• Your name contained words that are not suitable for the server.\n• Your name was not mentionable.\n\n__**Moderator:**__ ${interaction.author} **(${interaction.author.tag})**\n__**Reason:**__ ${reason}`
              )
              .setTimestamp();
            member.send({ embeds: [dmEmbed] });
          } else {
            let failembed = new MessageEmbed()
              .setColor(client.color.red)
              .setDescription(
                `${client.emoji.fail} | That user is a mod/admin, I can't do that.`
              )
              .setTimestamp();
            return interaction.reply({ embeds: [failembed], ephemeral: true });
          }
        } catch (err) {
          console.error(err);
          interaction.reply({
            content: "This command cannot be used in Direct Messages",
            ephemeral: true,
          });
        }
      } else if (subcommand === "mute") {
        try {
          const client = interaction.client;
          const logging = await Logging.findOne({
            guildId: interaction.guild.id,
          });

          if (!interaction.member.permissions.has("MODERATE_MEMBERS"))
            return interaction.followUp({
              content: "You do not have permission to use this command.",
              ephemeral: true,
            });

          const member = interaction.options.getMember("member");
          const reason =
            interaction.options.getString("reason") || "No reason provided";
          const time = ms(interaction.options.getString("time"));

          if (!member) {
            let usernotfound = new MessageEmbed()
              .setColor("RED")
              .setDescription(
                `${client.emoji.fail} | I can't find that member`
              );
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

          if (!time) {
            let timevalid = new MessageEmbed()
              .setColor("RED")
              .setDescription(
                `${client.emoji.fail} | The time specified is not valid. Please provide a valid time.`
              );
            return interaction.reply({ embeds: [timevalid] }).then(async () => {
              if (logging && logging.moderation.delete_reply === "true") {
                setTimeout(() => {
                  interaction.deleteReply().catch(() => {});
                }, 5000);
              }
            });
          }

          const response = await member.timeout(time, reason);

          if (response) {
            let timeoutsuccess = new MessageEmbed()
              .setColor("GREEN")
              .setDescription(
                `***${
                  client.emoji.success
                } | ${member} has been timed out for ${ms(time, {
                  long: true,
                })}* || ${reason}**`
              );
            await interaction
              .reply({ embeds: [timeoutsuccess] })
              .then(async () => {
                if (logging && logging.moderation.delete_reply === "true") {
                  setTimeout(() => {
                    interaction.deleteReply().catch(() => {});
                  }, 5000);
                }
              })
              .catch(() => {});

            let dmEmbed = new MessageEmbed()
              .setColor("RED")
              .setDescription(
                `You have been muted in **${
                  interaction.guild.name
                }**.\n\n__**Moderator:**__ ${interaction.user} **(${
                  interaction.user.tag
                })**\n__**Reason:**__ ${reason || "No Reason Provided"}`
              )
              .setTimestamp();

            // DM the user about the mute
            return member.send({ embeds: [dmEmbed] }).catch(() => {
              // Handle the case where the user has DMs disabled
              interaction.followUp({
                content: `I couldn't send a DM to ${member}, they might have DMs disabled.`,
                ephemeral: true,
              });
            });
          } else {
            let failembed = new MessageEmbed()
              .setColor(client.color.red)
              .setDescription(
                `${client.emoji.fail} | That user is a mod/admin, I can't do that.`
              )
              .setTimestamp();
            return interaction.reply({ embeds: [failembed] });
          }
        } catch (err) {
          console.error(err);
          interaction.reply({
            embeds: [
              new MessageEmbed()
                .setColor(interaction.client.color.red)
                .setDescription(
                  `${interaction.client.emoji.fail} | There was an error.`
                ),
            ],
            ephemeral: true,
          });
        }
      } else if (subcommand === "removewarn") {
        try {
          const client = interaction.client;
          const logging = await Logging.findOne({
            guildId: interaction.guild.id,
          });
          const guildDB = await Guild.findOne({
            guildId: interaction.guild.id,
          });
          let language = require(`../../data/language/${guildDB.language}.json`);

          if (!interaction.member.permissions.has("MODERATE_MEMBERS"))
            return interaction.reply({
              content: "You do not have permission to use this command.",
              ephemeral: true,
            });

          const mentionedMember = interaction.options.getMember("member");
          const warnID = interaction.options.getString("warning");

          if (!mentionedMember) {
            let usernotfound = new MessageEmbed()
              .setAuthor({
                name: `${interaction.user.tag}`,
                iconURL: interaction.member.displayAvatarURL({ dynamic: true }),
              })
              .setDescription(
                `${client.emoji.fail} | I couldn't find that member!`
              )
              .setTimestamp()
              .setColor(client.color.red);
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

          const warnDoc = await warnModel
            .findOne({
              guildID: interaction.guild.id,
              memberID: mentionedMember.id,
            })
            .catch((err) => console.log(err));

          if (!warnDoc || !warnDoc.warnings.length) {
            let nowarnerror = new MessageEmbed()
              .setAuthor({
                name: `${interaction.user.tag}`,
                iconURL: interaction.member.displayAvatarURL({ dynamic: true }),
              })
              .setDescription(
                `${client.emoji.fail} | No warnings found for ${mentionedMember}`
              )
              .setTimestamp()
              .setColor(client.color.red);
            return interaction
              .reply({ embeds: [nowarnerror] })
              .then(async () => {
                if (logging && logging.moderation.delete_reply === "true") {
                  setTimeout(() => {
                    interaction.deleteReply().catch(() => {});
                  }, 5000);
                }
              })
              .catch(() => {});
          }

          if (!warnID) {
            let warnIDinvalid = new MessageEmbed()
              .setAuthor({
                name: `${interaction.user.tag}`,
                iconURL: interaction.member.displayAvatarURL({ dynamic: true }),
              })
              .setDescription(
                `${client.emoji.fail} | ${language.rmWarnInvalid}`
              )
              .setTimestamp()
              .setColor(client.color.red);
            return interaction
              .reply({ embeds: [warnIDinvalid] })
              .then(async () => {
                if (logging && logging.moderation.delete_reply === "true") {
                  setTimeout(() => {
                    interaction.deleteReply().catch(() => {});
                  }, 5000);
                }
              })
              .catch(() => {});
          }

          let check = warnDoc.warningID.filter((word) => warnID === word);

          if (!warnDoc.warningID.includes(warnID)) {
            let warnremoveerror = new MessageEmbed()
              .setAuthor({
                name: `${interaction.user.tag}`,
                iconURL: interaction.member.displayAvatarURL({ dynamic: true }),
              })
              .setDescription(
                `${client.emoji.fail} | ${language.rmWarnInvalid}`
              )
              .setTimestamp()
              .setColor(client.color.red);
            return interaction
              .reply({ embeds: [warnremoveerror] })
              .then(async () => {
                if (logging && logging.moderation.delete_reply === "true") {
                  setTimeout(() => {
                    interaction.deleteReply().catch(() => {});
                  }, 5000);
                }
              })
              .catch(() => {});
          }

          if (!check) {
            let no = new MessageEmbed()
              .setAuthor({
                name: `${interaction.user.tag}`,
                conURL: interaction.member.displayAvatarURL({ dynamic: true }),
              })
              .setDescription(
                `${client.emoji.fail} | ${language.rmWarnInvalid}`
              )
              .setTimestamp()
              .setColor(client.color.red);
            return interaction
              .reply({ embeds: [no] })
              .then(async () => {
                if (logging && logging.moderation.delete_reply === "true") {
                  setTimeout(() => {
                    interaction.deleteReply().catch(() => {});
                  }, 5000);
                }
              })
              .catch(() => {});
          }

          let toReset = warnDoc.warningID.length;

          //warnDoc.memberID.splice(toReset - 1, toReset !== 1 ? toReset - 1 : 1)
          //warnDoc.guildID.splice(toReset - 1, toReset !== 1 ? toReset - 1 : 1)
          warnDoc.warnings.splice(toReset - 1, toReset !== 1 ? toReset - 1 : 1);
          warnDoc.warningID.splice(
            toReset - 1,
            toReset !== 1 ? toReset - 1 : 1
          );
          warnDoc.modType.splice(toReset - 1, toReset !== 1 ? toReset - 1 : 1);
          warnDoc.moderator.splice(
            toReset - 1,
            toReset !== 1 ? toReset - 1 : 1
          );
          warnDoc.date.splice(toReset - 1, toReset !== 1 ? toReset - 1 : 1);

          await warnDoc.save().catch((err) => console.log(err));

          const removeembed = new MessageEmbed()
            .setDescription(
              `${interaction.client.emoji.success} | Cleared warning **#${warnID}** from **${mentionedMember.user.tag}**`
            )
            .setColor(interaction.client.color.green);
          interaction
            .reply({ embeds: [removeembed] })
            .then(async () => {
              if (logging && logging.moderation.delete_reply === "true") {
                setTimeout(() => {
                  interaction.deleteReply().catch(() => {});
                }, 5000);
              }
            })
            .catch(() => {});
        } catch (err) {
          console.error(err);
          interaction.reply({
            content: "This command cannot be used in Direct Messages.",
            ephemeral: true,
          });
        }
      } else if (subcommand === "setnickname") {
        try {
          const client = interaction.client;
          const fail = client.emoji.fail;
          const success = client.emoji.success;
          const logging = await Logging.findOne({
            guildId: interaction.guild.id,
          });

          const member = interaction.options.getMember("member");
          const nickname = interaction.options.getString("nickname");
          const reason =
            interaction.options.getString("reason") || "No reason provided.";

          if (!interaction.member.permissions.has("MANAGE_NICKNAMES"))
            return interaction.reply({
              content: "You do not have permission to use this command.",
              ephemeral: true,
            });

          if (!member) {
            const usernotfound = new MessageEmbed()
              .setAuthor({
                name: `${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
              })
              .setTitle(`${fail} | Set Nickname Error`)
              .setDescription("Please provide a valid user")
              .setTimestamp()
              .setFooter({
                text: `${process.env.AUTH_DOMAIN}`,
              })
              .setColor(client.color.red);
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

          if (!member == interaction.guild.members.me) {
            if (!client.config.owner.includes(interaction.user.id)) {
              const error = new MessageEmbed()
                .setAuthor({
                  name: `${interaction.user.tag}`,
                  iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                })
                .setTitle(`${fail} | Set Nickname Error`)
                .setDescription(
                  `Only an owner of ${client.config.botName} can change the bots nickname for this server.`
                )
                .setTimestamp()
                .setFooter({
                  text: `${process.env.AUTH_DOMAIN}`,
                })
                .setColor(client.color.red);
              return interaction.reply({ embeds: [error], ephemeral: true });
            }
          } else {
            if (!nickname) {
              const oldNickname = member.nickname;
              await member.setNickname("");
              const embed = new MessageEmbed()
                .setDescription(
                  `${success} | Nickname for ${member} was reset.`
                )
                .setColor(client.color.green);
              interaction
                .reply({ embeds: [embed] })
                .then(async () => {
                  if (logging && logging.moderation.delete_reply === "true") {
                    setTimeout(() => {
                      interaction.deleteReply().catch(() => {});
                    }, 5000);
                  }
                })
                .catch(() => {});
            }

            let nick = nickname;
            if (nickname && !(nickname.length > 32)) {
              try {
                const oldNickname = member.nickname || member.user.username;
                await member.setNickname(nick);
                const embed = new MessageEmbed()
                  .setDescription(
                    `***${success} | ${oldNickname}'s nickname was set to ${nick}.* || Reason: ${reason}**`
                  )
                  .setColor(client.color.green);
                interaction
                  .reply({ embeds: [embed] })
                  .then(async () => {
                    if (logging && logging.moderation.delete_reply === "true") {
                      setTimeout(() => {
                        interaction.deleteReply().catch(() => {});
                      }, 5000);
                    }
                  })
                  .catch(() => {});

                if (logging) {
                  const role = interaction.guild.roles.cache.get(
                    logging.moderation.ignore_role
                  );
                  const channel = interaction.guild.channels.cache.get(
                    logging.moderation.channel
                  );

                  if (logging.moderation.toggle == "true") {
                    if (channel) {
                      if (
                        interaction.channel.id !==
                        logging.moderation.ignore_channel
                      ) {
                        if (
                          !role ||
                          (role &&
                            !interaction.member.roles.cache.find(
                              (r) => r.name.toLowerCase() === role.name
                            ))
                        ) {
                          if (logging.moderation.nicknames == "true") {
                            let color = logging.moderation.color;
                            if (color == "#000000")
                              color = interaction.client.color.yellow;

                            let logcase = logging.moderation.caseN;
                            if (!logcase) logcase = `1`;

                            let reason =
                              interaction.options.getString("reason");

                            if (!reason) reason = "No reason provided";

                            if (reason.length > 1024)
                              reason = reason.slice(0, 1021) + "...";

                            const logEmbed = new MessageEmbed()
                              .setAuthor({
                                name: `Action: \`Set Nickname\` | ${member.user.tag} | Case #${logcase}`,
                                iconURL: member.user.displayAvatarURL({
                                  format: "png",
                                }),
                              })
                              .addFields(
                                {
                                  name: "User",
                                  value: `${member}`,
                                  inline: true,
                                },
                                {
                                  name: "Moderator",
                                  value: `${interaction.user}`,
                                  inline: true,
                                },
                                {
                                  name: "Reason",
                                  value: `${reason}`,
                                  inline: true,
                                }
                              )
                              .setFooter({
                                text: `ID: ${member.id}`,
                              })
                              .setTimestamp()
                              .setColor(color);

                            send(
                              channel,
                              { embeds: [logEmbed] },
                              {
                                name: `${interaction.client.user.username}`,
                                username: `${interaction.client.user.username}`,
                                icon: interaction.client.user.displayAvatarURL({
                                  dynamic: true,
                                  format: "png",
                                }),
                              }
                            ).catch(() => {});

                            logging.moderation.caseN = logcase + 1;
                            await logging.save().catch(() => {});
                          }
                        }
                      }
                    }
                  }
                }
              } catch (err) {
                console.error(err.stack);
                interaction.reply({
                  embeds: [
                    new MessageEmbed()
                      .setAuthor({
                        name: `${interaction.user.tag}`,
                        iconURL: interaction.user.displayAvatarURL({
                          dynamic: true,
                        }),
                      })
                      .setTitle(`${fail} Set Nickname Error`)
                      .setDescription(
                        `Please ensure my role is above the provided user's role.`
                      )
                      .setTimestamp()
                      .setFooter({
                        text: `${process.env.AUTH_DOMAIN}`,
                      })
                      .setColor(client.color.red),
                  ],
                });
              }
            } else {
              interaction.reply({
                embeds: [
                  new MessageEmbed()
                    .setAuthor({
                      name: `${interaction.user.tag}`,
                      iconURL: interaction.user.displayAvatarURL({
                        dynamic: true,
                      }),
                    })
                    .setTitle(`${fail} | Set Nickname Error`)
                    .setDescription(`The nickname is too long!`),
                ],
              });
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
      } else if (subcommand === "softban") {
        try {
          let client = interaction.client;

          const logging = await Logging.findOne({
            guildId: interaction.guild.id,
          });

          const guildDB = await Guild.findOne({
            guildId: interaction.guild.id,
          });
          const language = require(`../../data/language/${guildDB.language}.json`);

          const member = interaction.options.getMember("member");
          let reason =
            interaction.options.getString("reason") || "No Reason Provided";

          if (!interaction.member.permissions.has("BAN_MEMBERS"))
            return interaction.reply({
              content: "You do not have permission to use this command.",
              ephemeral: true,
            });

          if (!member) {
            let embed = new MessageEmbed()
              .setDescription(
                `${client.emoji.fail} | ${language.softbanNoUser}`
              )
              .setColor(client.color.red);
            return interaction
              .reply({ embeds: [embed] })
              .then(async () => {
                if (logging && logging.moderation.delete_reply === "true") {
                  setTimeout(() => {
                    interaction.deleteReply().catch(() => {});
                  }, 5000);
                }
              })
              .catch(() => {});
          }

          if (member === interaction.member) {
            let embed = new MessageEmbed()
              .setDescription(
                `${client.emoji.fail} | ${language.softbanSelfUser}`
              )
              .setColor(client.color.red);
            return interaction
              .reply({ embeds: [embed] })
              .then(async () => {
                if (logging && logging.moderation.delete_reply === "true") {
                  setTimeout(() => {
                    interaction.deleteReply().catch(() => {});
                  }, 5000);
                }
              })
              .catch(() => {});
          }

          if (reason.length > 1024) reason = reason.slice(0, 1021) + "...";
          if (member) {
            await member.ban({
              reason: `${reason} / ${language.softbanResponsible}: ${interaction.user.tag}`,
              days: 7,
            });
            await interaction.guild.members.unban(
              member.user,
              `${reason} / ${language.softbanResponsible}: ${interaction.user.tag}`
            );

            const embed = new MessageEmbed()
              .setDescription(
                `${client.emoji.success} | ${language.softbanSuccess} **${
                  member.user.tag
                }** ${
                  logging && logging.moderation.include_reason === "true"
                    ? `\n\n**Reason:** ${reason}`
                    : ``
                }`
              )
              .setColor(client.color.green);
            interaction
              .reply({ embeds: [embed] })
              .then(async () => {
                if (logging && logging.moderation.delete_reply === "true") {
                  setTimeout(() => {
                    interaction.deleteReply().catch(() => {});
                  }, 5000);
                }
              })
              .catch(() => {});
          }
        } catch (err) {
          console.error(err);
          interaction.reply({
            content: "This command cannot be used in Direct Messages.",
            ephemeral: true,
          });
        }
      } else if (subcommand === "unban") {
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
            interaction.options.getString("reason") ||
            `${language.unbanNoReason}`;

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

                ban.user.send({
                  embeds: [
                    new MessageEmbed()
                      .setColor(interaction.client.color.green)
                      .setDescription(dmEmbed),
                  ],
                });
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
                content: `${language.unbanInvalidId}`,
                ephemeral: true,
              });
            }

            // Unban the user
            await interaction.guild.bans.remove(banInfo.user.id, reason);

            // Reply with a success message
            const unbanSuccessEmbed = new MessageEmbed()
              .setColor("GREEN")
              .setDescription(
                `${client.emoji?.success || "✅"} | <@${banInfo.user.id}> ${
                  language.unbanSuccess
                }\n__**Reason:**__ ${reason}`
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
      } else if (subcommand === "unmute") {
        try {
          const client = interaction.client;
          const logging = await Logging.findOne({
            guildId: interaction.guild.id,
          });

          // Check if the user has permission to use this command
          if (!interaction.member.permissions.has("MODERATE_MEMBERS"))
            return interaction.followUp({
              content: "You do not have permission to use this command.",
            });

          const member = interaction.options.getMember("member");
          const reason =
            interaction.options.getString("reason") || "No reason provided";

          // Check if the member is valid
          if (!member) {
            let usernotfound = new MessageEmbed()
              .setColor("RED")
              .setDescription(
                `${client.emoji.fail} | I can't find that member`
              );
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

          // Remove timeout (unmute the member)
          await member.timeout(null, reason); // This will remove the timeout

          let timeoutsuccess = new MessageEmbed()
            .setColor("GREEN")
            .setDescription(
              `${client.emoji.success} | ${member} has been unmuted.`
            );
          await interaction
            .reply({ embeds: [timeoutsuccess] })
            .then(async () => {
              if (logging && logging.moderation.delete_reply === "true") {
                setTimeout(() => {
                  interaction.deleteReply().catch(() => {});
                }, 5000);
              }
            })
            .catch(() => {});

          // DM the user about the unmute
          let dmEmbed = new MessageEmbed()
            .setColor("GREEN")
            .setDescription(
              `You have been unmuted in **${
                interaction.guild.name
              }**.\n\n__**Moderator:**__ ${interaction.user} **(${
                interaction.user.tag
              })**\n__**Reason:**__ ${reason || "No Reason Provided"}`
            )
            .setTimestamp();

          return member.send({ embeds: [dmEmbed] }).catch(() => {
            // Handle the case where the user has DMs disabled
            interaction.followUp({
              content: `I couldn't send a DM to ${member}, they might have DMs disabled.`,
              ephemeral: true,
            });
          });
        } catch (err) {
          console.error(err);
          interaction.reply({
            embeds: [
              new MessageEmbed()
                .setColor(interaction.client.color.red)
                .setDescription(
                  `${interaction.client.emoji.fail} | An error occurred.`
                ),
            ],
            ephemeral: true,
          });
        }
      } else if (subcommand === "warn") {
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
            interaction.options.getString("reason") || "No reason provided";

          if (!mentionedMember) {
            let validmention = new MessageEmbed()
              .setColor(client.color.red)
              .setDescription(
                `${client.emoji.fail} | ${language.warnMissingUser}`
              )
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

          await warnDoc.save().catch((err) => console.log(err));

          let dmEmbed;
          if (
            logging &&
            logging.moderation.warn_action &&
            logging.moderation.warn_action !== "1"
          ) {
            if (logging.moderation.warn_action === "2") {
              dmEmbed = `${interaction.client.emoji.fail} | You were warned in **${interaction.guild.name}**.`;
            } else if (logging.moderation.warn_action === "3") {
              dmEmbed = `${interaction.client.emoji.fail} | You were warned in **${interaction.guild.name}** for ${reason}`;
            } else if (logging.moderation.warn_action === "4") {
              dmEmbed = `${interaction.client.emoji.fail} | You were warned in **${interaction.guild.name}** by **${interaction.member} (${interaction.member.tag})** for ${reason}`;
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
                    }`),
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
      } else if (subcommand === "warnings") {
        try {
          let client = interaction.client;

          const guildDB = await Guild.findOne({
            guildId: interaction.guild.id,
          });
          let language = require(`../../data/language/${guildDB.language}.json`);

          if (!interaction.member.permissions.has("MODERATE_MEMBERS"))
            return interaction.reply({
              content: "You do not have permission to use this command.",
              ephemeral: true,
            });

          const mentionedMember =
            interaction.options.getMember("member") || interaction.member;

          const warnDoc = await warnModel
            .findOne({
              guildID: interaction.guild.id,
              memberID: mentionedMember.id,
            })
            .catch((err) => console.log(err));

          if (!warnDoc || !warnDoc.warnings.length) {
            return interaction.reply({
              embeds: [
                new MessageEmbed()
                  .setDescription(
                    `${interaction.client.emoji.fail} | **${mentionedMember.user.tag}** ${language.warningsNoError}`
                  )
                  .setTimestamp()
                  .setColor(client.color.red),
              ],
            });
          }

          const data = [];

          for (let i = 0; warnDoc.warnings.length > i; i++) {
            data.push(
              `**Moderator:** ${await interaction.client.users.fetch(
                warnDoc.moderator[i]
              )}\n**Reason:** ${warnDoc.warnings[i]}\n**Date:** ${moment(
                warnDoc.date[i]
              ).format("dddd, MMMM do YYYY")}\n**Warning ID:** ${i + 1}`
            );
          }

          const count = warnDoc.warnings.length;

          const embed = new MessageEmbed()
            .setTimestamp()
            .setColor(client.color.blue);

          const buildEmbed = (current, embed) => {
            const max = count > current + 4 ? current + 4 : count;
            let amount = 0;
            for (let i = current; i < max; i++) {
              if (warnDoc.warnings[i].length > 1000)
                warnDoc.warnings[i] =
                  warnDoc.warnings[i].slice(0, 1000) + "...";
              embed.addFields(
                {
                  name: "\u200b",
                  value: `**${language.warnName || "unknown"} \`#${i + 1}\`**`,
                },
                {
                  name: `${language.warnModerator || "unknown"}`,
                  value: `${interaction.guild.members.cache.get(
                    warnDoc.moderator[i]
                  )}`,
                  inline: true,
                },
                {
                  name: `${language.warnAction || "unknown"}`,
                  value: `${warnDoc.modType[i]}`,
                  inline: true,
                },
                {
                  name: `${language.warnReason || "unknown"}`,
                  value: `${warnDoc.warnings[i]}`,
                  inline: true,
                },
                {
                  name: `${language.warnID || "unknown"}`,
                  value: `${warnDoc.warningID[i]}`,
                  inline: true,
                },
                {
                  name: `${language.warnDateIssued || "unknown"}`,
                  value: `${moment(warnDoc.date[i]).format(
                    "dddd, MMMM Do YYYY"
                  )}`,
                }
              );
              amount += 1;
            }

            return embed
              .setTitle(`${language.warnList} [${current} - ${max}]`)
              .setDescription(
                `Showing \`${amount}\` of ${mentionedMember}'s \`${count}\` total warns.`
              );
          };

          if (count < 4) interaction.reply({ embeds: [buildEmbed(0, embed)] });
          else {
            let n = 0;
            const json = embed
              .setFooter({
                text:
                  `${language.warnExpire}\n` + interaction.member.displayName,
                iconURL: interaction.member.displayAvatarURL({ dynamic: true }),
              })
              .toJSON();

            const first = () => {
              if (n === 0) return;
              n = 0;
              return buildEmbed(n, new MessageEmbed(json));
            };

            const previous = () => {
              if (n === 0) return;
              n -= 4;
              if (n < 0) n = 0;
              return buildEmbed(n, new MessageEmbed(json));
            };

            const next = () => {
              const cap = count - (count % 4);
              if (n === cap || n + 4 === count) return;
              n += 4;
              if (n >= count) n = cap;
              return buildEmbed(n, new MessageEmbed(json));
            };

            const last = () => {
              const cap = count - (count % 4);
              if (n === cap || n + 4 === count) return;
              n = cap;
              if (n === count) n -= 4;
              return buildEmbed(n, new MessageEmbed(json));
            };

            const reactions = {
              "⏪": first,
              "◀️": previous,
              "⏹️": null,
              "▶️": next,
              "⏩": last,
            };

            const menu = new ReactionMenu(
              interaction.client,
              interaction.channel,
              interaction.member,
              buildEmbed(n, new MessageEmbed(json)),
              null,
              null,
              reactions,
              180000
            );

            menu.reactions["⏹️"] = menu.stop.bind(menu);
          }
        } catch (err) {
          console.error(err);
          interaction.reply({
            content: "This command cannot be used in Direct Messages.",
            ephemeral: true,
          });
        }
      } else if (subcommand === "warnpurge") {
        try {
          const client = interaction.client;

          const logging = await Logging.findOne({
            guildId: interaction.guild.id,
          });
          const guildDB = await Guild.findOne({
            guildId: interaction.guild.id,
          });
          let language = require(`../../data/language/${guildDB.language}.json`);

          if (!interaction.member.permissions.has("MODERATE_MEMBERS"))
            return interaction.reply({
              content: "You do not have permission to use this command.",
              ephemeral: true,
            });

          const fail = client.emoji.fail;
          const success = client.emoji.success;
          const mentionedMember = interaction.options.getMember("member");
          const amount = interaction.options.getInteger("amount");
          const reason =
            interaction.options.getString("reason") || "No Reason Provided";

          if (!mentionedMember) {
            let usernotfound = new MessageEmbed()
              .setColor(client.color.red)
              .setDescription(
                `${client.emoji.fail} | ${language.warnMissingUser}`
              )
              .setTimestamp();
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

          if (amount < 0 || amount > 100) {
            let invalidamount = new MessageEmbed();
            new MessageEmbed()
              .setAuthor({
                name: `${interaction.user.tag}`,
                iconURL: interaction.member.displayAvatarURL({ dynamic: true }),
              })
              .setTitle(`${fail} | Warn Purge Error`)
              .setDescription(`Please Provide a message count between 1 - 100!`)
              .setTimestamp()
              .setFooter({
                text: `${process.env.AUTH_DOMAIN}`,
              })
              .setColor(client.color.red);
            return interaction
              .reply({ embeds: [invalidamount] })
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
              warningID: [],
              moderator: [],
              date: [],
            });

            await warnDoc.save().catch((err) => console.log(err));

            warnDoc = await warnModel.findOne({
              guildID: interaction.guild.id,
              memberID: mentionedMember.id,
            });
          }
          warnDoc.modType.push("warn purge");
          warnDoc.warnings.push(reason);
          warnDoc.warningID.push(warnID);
          warnDoc.moderator.push(interaction.member.id);
          warnDoc.date.push(Date.now());

          await warnDoc.save().catch((err) => console.log(err));
          let dmEmbed;
          if (
            logging &&
            logging.moderation.warn_action &&
            logging.moderation.warn_action !== "1"
          ) {
            if (logging.moderation.warn_action === "2") {
              dmEmbed = `${interaction.client.emoji.fail} | You've been warned in **${interaction.guild.name}**.`;
            } else if (logging.moderation.warn_action === "3") {
              dmEmbed = `${interaction.client.emoji.fail} | You've been warned in **${interaction.guild.name}** for ${reason}`;
            } else if (logging.moderation.warn_action === "4") {
              dmEmbed = `${interaction.client.emoji.fail} | You've been warned in **${interaction.guild.name}** by ${interaction.author} **(${interaction.user.tag})** for ${reason}`;
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

          // Purge
          const messages = (
            await interaction.channel.messages.fetch({ limit: amount })
          ).filter((m) => m.member.id === mentionedMember.id);
          if (messages.size > 0)
            await interaction.channel.bulkDelete(messages, true);

          if (mentionedMember) {
            const embed = new MessageEmbed()
              .setDescription(
                `${success} | **${mentionedMember.user.tag}** has been warned, with **${messages.size}** messages purged.\n\n__**Reason:**__ ${reason}`
              )
              .setColor(client.color.green)
              .setTimestamp();
            interaction
              .reply({ embeds: [embed] })
              .then(async () => {
                if (logging && logging.moderation.delete_reply === "true") {
                  setTimeout(() => {
                    interaction.deleteReply().catch(() => {});
                  }, 5000);
                }
              })
              .catch(() => {});
          }
        } catch (err) {
          console.error(err);
          interaction.reply({
            content: "This command cannot be used in Direct Messages.",
            ephemeral: true,
          });
        }
      }
    }
  },
};
