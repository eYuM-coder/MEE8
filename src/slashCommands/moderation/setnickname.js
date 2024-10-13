const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, Message } = require("discord.js");
const Logging = require("../../database/schemas/logging");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setnickname")
    .setDescription("Changes the nickname of a provided user")
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("The member to change the nickname of")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("nickname").setDescription("The nickname"),
    )
    .addStringOption((option) => option.setName("reason").setDescription("The reason for the change")),
  async execute(interaction) {
    try {
      const client = interaction.client;
      const fail = client.emoji.fail;
      const success = client.emoji.success;
      const logging = await Logging.findOne({ guildId: interaction.guild.id });

      const member = interaction.options.getMember("member");
      const nickname = interaction.options.getString("nickname");
      const reason = interaction.options.getString("reason");

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
          .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
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

      if (member.id === interaction.member.id) {
        const setnickerror = new MessageEmbed()
          .setAuthor({
            name: `${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          })
          .setTitle(`${fail} | Set Nickname Error`)
          .setDescription("You can't change your own nickname!")
          .setTimestamp()
          .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
          .setColor(client.color.red);
        return interaction
          .reply({ embeds: [setnickerror] })
          .then(async () => {
            if (logging && logging.moderation.delete_reply === "true") {
              setTimeout(() => {
                interaction.deleteReply().catch(() => {});
              }, 5000);
            }
          })
          .catch(() => {});
      }

      if (
        member.roles.highest.position >=
        interaction.member.roles.highest.position
      ) {
        const rolesmatch = new MessageEmbed()
          .setAuthor({
            name: `${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
          })
          .setTitle(`${fail} | Set Nickname Error`)
          .setDescription(
            "The provided user has either an equal or higher role.",
          )
          .setTimestamp()
          .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
          .setColor(client.color.red);
        return interaction
          .reply({ embeds: [rolesmatch] })
          .then(async () => {
            if (logging && logging.moderation.delete_reply === "true") {
              setTimeout(() => {
                interaction.deleteReply().catch(() => {});
              }, 5000);
            }
          })
          .catch(() => {});
      }

      if (!nickname) {
        const oldNickname = member.nickname;
        await member.setNickname("");
        const embed = new MessageEmbed()
          .setDescription(`${success} | Nickname for ${member} was reset.`)
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
              `***${success} | ${oldNickname}'s nickname was set to ${nick}.* || Reason: ${reason}**`,
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
                  if (interaction.channel.id !== logging.moderation.ignore_channel) {
                    if (
                      !role ||
                      (role &&
                        !interaction.member.roles.cache.find(
                          (r) => r.name.toLowerCase() === role.name
                        ))
                    ) {
                      if (logging.moderation.nicknames == "true") {
                        let color = logging.moderation.color;
                        if (color == "#000000") color = interaction.client.color.yellow;
    
                        let logcase = logging.moderation.caseN;
                        if (!logcase) logcase = `1`;
    
                        let reason = interaction.options.getString("reason");
    
                        if (!reason) reason = "No reason provided";
                        if (reason.length > 1024)
                          reason = reason.slice(0, 1021) + "...";
    
                        const logEmbed = new MessageEmbed()
                          .setAuthor(
                            `Action: \`Set Nickname\` | ${member.user.tag} | Case #${logcase}`,
                            member.user.displayAvatarURL({ format: "png" })
                          )
                          .addField("User", `${member}`, true)
                          .addField("Moderator", `${interaction.user}`, true)
                          .addField("Reason", `${reason}`, true)
                          .setFooter({ text: `ID: ${member.id}` })
                          .setTimestamp()
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
          console.error(err.stack);
          interaction.reply({
            embeds: [
              new MessageEmbed()
                .setAuthor({
                  name: `${interaction.user.tag}`,
                  iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                })
                .setTitle(`${fail} Set Nickname Error`)
                .setDescription(
                  `Please ensure my role is above the provided user's role.`,
                )
                .setTimestamp()
                .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
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
              iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            })
            .setTitle(`${fail} | Set Nickname Error`)
            .setDescription(`The nickname is too long!`)
          ],
        });
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
