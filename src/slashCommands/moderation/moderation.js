const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Logging = require("../../database/schemas/logging.js");
const Guild = require("../../database/schemas/Guild.js");
const logger = require("../../utils/logger.js");
const send = require("../../packages/logs/index.js");
const ms = require("ms");
const ReactionMenu = require("../../data/ReactionMenu.js");
const darkpassword = require("generate-password");

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
              option.setName("member").setDescription("The member to mute")
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
    )
    .addSubcommandGroup((roleGroup) =>
      roleGroup
        .setName("role")
        .setDescription("Role users with a specific role")
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

                    send(loggingChannel, {
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
        .setColor(interaction.guild.me.displayHexColor);

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

        if (subcommand === "all") {
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
            reason = `No Reason Provided`;
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
                text: "https://6c7f021b-2514-4460-9d5a-64060cec1990-00-30w9y136gg7mt.riker.replit.dev",
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
                        `Role Add / Responsible User: ${interaction.user.tag}, Reason: ${reason}`,
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
                  await members.forEach((member) =>
                    member.roles.remove(role, [
                      `Role Remove / Responsible User: ${interaction.user.tag}`,
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

          let reason = `The current feature doesn't need a reason.`;
          if (!reason) {
            reason = `No Reason Provided`;
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
                text: "https://6c7f021b-2514-4460-9d5a-64060cec1990-00-30w9y136gg7mt.riker.replit.dev",
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
                        `Role Add / Responsible User: ${interaction.user.tag}`,
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
                  await members.forEach((member) =>
                    member.roles.remove(role, [
                      `Role Remove / Responsible User: ${interaction.user.tag}`,
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

          let reason = `The current feature doesn't need a reason.`;
          if (!reason) {
            reason = `No Reason Provided`;
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
                text: "https://6c7f021b-2514-4460-9d5a-64060cec1990-00-30w9y136gg7mt.riker.replit.dev",
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
                        `Role Add / Responsible User: ${interaction.user.tag}`,
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
                        `Role Remove / Responsible User: ${interaction.user.tag}`,
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
          let reason = `The current feature doesn't need a reason.`;
          if (!reason) {
            reason = `No Reason Provided`;
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
                text: "https://6c7f021b-2514-4460-9d5a-64060cec1990-00-30w9y136gg7mt.riker.replit.dev",
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
                  text: "https://6c7f021b-2514-4460-9d5a-64060cec1990-00-30w9y136gg7mt.riker.replit.dev",
                })
                .setColor(interaction.client.color.red);
              return interaction.reply({
                embeds: [alreadyhasrole],
                ephmeral: true,
              });
            } else {
              member.roles
                .add(role, [
                  `Role Add / Responsible User: ${interaction.user.tag}`,
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
                      text: "https://6c7f021b-2514-4460-9d5a-64060cec1990-00-30w9y136gg7mt.riker.replit.dev",
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
          let reason = `The current feature doesn't need a reason.`;
          if (!reason) {
            reason = `No reason provided.`;
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
                text: "https://6c7f021b-2514-4460-9d5a-64060cec1990-00-30w9y136gg7mt.riker.replit.dev",
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
                  text: "https://6c7f021b-2514-4460-9d5a-64060cec1990-00-30w9y136gg7mt.riker.replit.dev",
                })
                .setColor(interaction.client.color.red);
              return interaction.reply({
                embeds: [nothasrole],
                ephemeral: true,
              });
            } else {
              member.roles
                .remove(role, [
                  `Role Remove / Responsible User: ${interaction.user.tag}`,
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
                      text: `https://6c7f021b-2514-4460-9d5a-64060cec1990-00-30w9y136gg7mt.riker.replit.dev`,
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
            text: `https://6c7f021b-2514-4460-9d5a-64060cec1990-00-30w9y136gg7mt.riker.replit.dev`,
          })
          .setColor(interaction.client.color.red);
        return interaction.reply({
          embeds: [botrolepossiblylow],
          ephemeral: true,
        });
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

                logChannel.send({ embeds: [logEmbed] }).catch(console.error);
              }
            }
          } else {
            return interaction.reply({
              content: `${client.emoji.fail} | I couldn't ban this user. Make sure I have the correct permissions.`,
              ephemeral: true,
            });
          }
        } catch (err) {
          console.error(err);
          interaction.reply({
            content: `${client.emoji.fail} | An error occurred while trying to ban the user.`,
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
                `${client.emoji.fail} | I can't moderate their nickname, make sure that my role is above their role or that I have sufficient permissions to run the command.`
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
      }
    }
  },
};
