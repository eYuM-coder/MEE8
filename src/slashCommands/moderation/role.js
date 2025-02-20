const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Logging = require("../../database/schemas/logging.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("role")
    .setDescription("Adds a role to a user.")
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
    .setContexts(0)
    .setIntegrationTypes(0),
  async execute(interaction) {
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
      const logging = await Logging.findOne({ guildId: interaction.guild.id });

      if (interaction.options.getSubcommand() === "all") {
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
          return interaction.reply({ embeds: [rolenotfound], ephmeral: true });
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
                    if (logging && logging.moderation.delete_reply === "true") {
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
                    if (logging && logging.moderation.delete_reply === "true") {
                      setTimeout(() => {
                        interaction.deleteReply().catch(() => {});
                      }, 5000);
                    }
                  })
                  .catch(() => {});
              });
          }
        }
      } else if (interaction.options.getSubcommand() === "bots") {
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
          return interaction.reply({ embeds: [rolenotfound], ephmeral: true });
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
                    if (logging && logging.moderation.delete_reply === "true") {
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
                    if (logging && logging.moderation.delete_reply === "true") {
                      setTimeout(() => {
                        interaction.deleteReply().catch(() => {});
                      }, 5000);
                    }
                  })
                  .catch(() => {});
              });
          }
        }
      } else if (interaction.options.getSubcommand() === "humans") {
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
          return interaction.reply({ embeds: [rolenotfound], ephmeral: true });
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
                    if (logging && logging.moderation.delete_reply === "true") {
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
                    if (logging && logging.moderation.delete_reply === "true") {
                      setTimeout(() => {
                        interaction.deleteReply().catch(() => {});
                      }, 5000);
                    }
                  })
                  .catch(() => {});
              });
          }
        }
      } else if (interaction.options.getSubcommand() === "add") {
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
          return interaction.reply({ embeds: [rolenotfound], ephmeral: true });
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
                    if (logging && logging.moderation.delete_reply === "true") {
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
      } else if (interaction.options.getSubcommand() === "remove") {
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
          return interaction.reply({ embeds: [rolenotfound], ephemeral: true });
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
            return interaction.reply({ embeds: [nothasrole], ephemeral: true });
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
                    if (logging && logging.moderation.delete_reply === "true") {
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
  },
};
