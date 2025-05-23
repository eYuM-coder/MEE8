const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, WebhookClient } = require("discord.js");
const User = require("../../database/schemas/User");
const config = require("../../../config.json");
const webhookClient = new WebhookClient({
  url: config.webhooks.blacklist,
});
const Blacklist = require("../../database/schemas/blacklist");
const { exec } = require("child_process");
const NewsSchema = require("../../database/schemas/Neonova");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("owner")
    .setDescription("All owner commands")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("addbadge")
        .setDescription("Add a badge to a user")
        .addStringOption((option) =>
          option
            .setName("badge")
            .setDescription("The badge to add")
            .setRequired(true)
        )
        .addUserOption((option) =>
          option
            .setName("member")
            .setDescription("The member to give the badge to")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("blacklist")
        .setDescription("Adds a user or guild to the blacklist")
        .addStringOption((option) =>
          option
            .setName("target")
            .setDescription("The target type (user or guild).")
            .setRequired(true)
            .addChoices(
              { name: "user", value: "user" },
              { name: "guild", value: "guild" }
            )
        )
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to blacklist (only for user type).")
        )
        .addStringOption((option) =>
          option
            .setName("guild")
            .setDescription("The guild to blacklist (only for guild type).")
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("The reason for blacklisting.")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("clearbackups")
        .setDescription("Clears all backups on the bot.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("createbackup")
        .setDescription("Creates a backup of the bot's .env file.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("eval")
        .setDescription("This is for the developers.")
        .addStringOption((option) =>
          option
            .setName("thing-to-eval")
            .setDescription("Thing to evaluate")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("exec")
        .setDescription("This is for the developers.")
        .addStringOption((option) =>
          option
            .setName("thing-to-exec")
            .setDescription("Thing to execute")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("fetchinvite")
        .setDescription("Fetch an invite from a server!")
        .addStringOption((option) =>
          option
            .setName("guild")
            .setDescription("The guild ID")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("leaveguild")
        .setDescription("Forces the bot to leave a guild.")
        .addStringOption((option) =>
          option
            .setName("guild")
            .setDescription("The guild ID")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("stop")
        .setDescription("Stops the bot")
        .addBooleanOption((option) =>
          option
            .setName("force")
            .setDescription("Force stop without graceful shutdown")
        )
        .addBooleanOption((option) =>
          option.setName("silent").setDescription("Stop without logging")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("server")
        .setDescription("Information of a server")
        .addStringOption((option) =>
          option
            .setName("guild")
            .setDescription("The guild ID")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("servers")
        .setDescription("View every server the bot is in")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("setnews")
        .setDescription("This is for the developers.")
        .addStringOption((option) =>
          option
            .setName("text")
            .setDescription("The text you want to set")
            .setRequired(true)
        )
    ),
  async execute(interaction) {
    const client = interaction.client;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "addbadge") {
      if (
        !config.owner.includes(interaction.user.id) &&
        (config.developers.includes(interaction.user.id) ||
          !config.developers.includes(interaction.user.id))
      ) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(client.color.red)
              .setDescription(
                `${client.emoji.fail} | This command is for the owner.`
              ),
          ],
          ephemeral: true,
        });
      }

      let user = interaction.options.getMember("member") || interaction.member;

      if (!user)
        return interaction.reply({
          content: "Provide me with a user.",
          ephemeral: true,
        });

      const badge = interaction.options.getString("badge");
      if (!badge)
        return interaction.reply({
          content: "Provide me with a badge",
          ephemeral: true,
        });

      let userFind = await User.findOne({
        discordId: user.id,
      });

      if (!userFind) {
        const newUser = new User({
          discordId: interaction.user.id,
        });

        newUser.save();
        userFind = await User.findOne({
          discordId: user.id,
        });
      }

      if (userFind.badges && userFind.badges.includes(badge))
        return interaction.reply({
          content: `They already have that badge`,
          ephemeral: true,
        });

      userFind.badges.push(badge);
      await userFind.save().catch(() => {});
      interaction.reply({
        content: `Added the "${badge}" badge to the user!`,
        ephemeral: true,
      });
    } else if (subcommand === "blacklist") {
      if (
        !config.owner.includes(interaction.user.id) &&
        (config.developers.includes(interaction.user.id) ||
          !config.developers.includes(interaction.user.id))
      ) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(client.color.red)
              .setDescription(
                `${client.emoji.fail} | This command is for the owner.`
              ),
          ],
          ephemeral: true,
        });
      }

      const targetType = interaction.options.getString("target");
      const reason = interaction.options.getString("reason") || "Not Specified";
      let member, guild;

      if (targetType === "user") {
        member = interaction.options.getUser("user");

        if (!member) {
          return interaction.reply("Please provide a valid user.");
        }

        // Add the user to the blacklist
        await Blacklist.findOneAndUpdate(
          { discordId: member.id },
          {
            type: "user",
            isBlacklisted: true,
            reason,
            length: null,
          },
          { upsert: true }
        );

        // Send a confirmation message
        await interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor("BLURPLE")
              .setTitle("User added to the blacklist!")
              .setDescription(`${member.tag} - \`${reason}\``),
          ],
        });

        // Send to webhook
        const embed = new MessageEmbed()
          .setColor("BLURPLE")
          .setTitle("Blacklist Report")
          .addFields(
            { name: "Status", value: "Added to the blacklist." },
            { name: "User", value: `${member.tag} (${member.id})` },
            {
              name: "Responsible",
              value: `${interaction.user.tag} (${interaction.user.id})`,
            },
            { name: "Reason", value: reason }
          );

        return webhookClient.send({
          username: "Neonova",
          avatarURL: "https://neonova.eyum.org/logo.png",
          embeds: [embed],
        });
      }

      if (targetType === "guild") {
        guild = interaction.options.getString("guild");

        if (!guild) {
          return interaction.reply("Please provide a valid guild.");
        }

        // Add the guild to the blacklist
        await Blacklist.findOneAndUpdate(
          { guildId: guild },
          {
            type: "guild",
            isBlacklisted: true,
            reason,
            length: null,
          },
          { upsert: true }
        );

        // Send a confirmation message
        await interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor("BLURPLE")
              .setTitle("Server added to the blacklist!")
              .setDescription(`${guild} - \`${reason}\``),
          ],
        });

        // Send to webhook
        const embed = new MessageEmbed()
          .setColor("BLURPLE")
          .setTitle("Blacklist Report")
          .addFields(
            { name: "Status", value: "Added to the blacklist." },
            { name: "Server", value: `${guild}` },
            {
              name: "Responsible",
              value: `${interaction.user.tag} (${interaction.user.id})`,
            },
            { name: "Reason", value: reason }
          );

        return webhookClient.send({
          username: `${config.botName} Blacklists`,
          avatarURL: "https://neonova.eyum.org/logo.png",
          embeds: [embed],
        });
      }
    } else if (subcommand === "clearbackups") {
      if (
        !config.owner.includes(interaction.user.id) &&
        (config.developers.includes(interaction.user.id) ||
          !config.developers.includes(interaction.user.id))
      ) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(client.color.red)
              .setDescription(
                `${client.emoji.fail} | This command is for the owner.`
              ),
          ],
          ephemeral: true,
        });
      }

      await interaction
        .reply({ content: "Clearing .env backups...", ephemeral: true })
        .catch((err) => console.error(err));

      exec("neonova clearbackups", (error, stdout, stderr) => {
        if (error) {
          console.error(`Backup removal error: ${error.message}`);
          return interaction.editReply({
            content: `Backups could not be cleared due to the following error:\n\`\`\`${
              stderr || error.message
            }\`\`\``,
            ephemeral: true,
          });
        }

        console.log(`Backups Cleared with these logs:\n${stdout}`);
        interaction.editReply({
          content: `Backups Cleared.`,
          ephemeral: true,
        });

        setTimeout(() => {}, 3000);
      });
    } else if (subcommand === "createbackup") {
      if (
        !config.owner.includes(interaction.user.id) &&
        (config.developers.includes(interaction.user.id) ||
          !config.developers.includes(interaction.user.id))
      ) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(client.color.red)
              .setDescription(
                `${client.emoji.fail} | This command is for the owner.`
              ),
          ],
          ephemeral: true,
        });
      }

      await interaction
        .reply({ content: "Creating .env backup...", ephemeral: true })
        .catch((err) => console.error(err));

      exec("neonova backup", (error, stdout, stderr) => {
        if (error) {
          console.error(`Backup creation error: ${error.message}`);
          return interaction.editReply({
            content: `Backup could not be created due to the following error:\n\`\`\`${
              stderr || error.message
            }\`\`\``,
            ephemeral: true,
          });
        }

        console.log(`Backup Created with these logs:\n${stdout}`);
        interaction.editReply({
          content: `Backup Created.`,
          ephemeral: true,
        });

        setTimeout(() => {}, 3000);
      });
    } else if (subcommand === "eval") {
      const input = interaction.options.getString("thing-to-eval");

      if (
        !config.owner.includes(interaction.user.id) &&
        !config.developers.includes(interaction.user.id)
      ) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(client.color.red)
              .setDescription(
                `${client.emoji.fail} | You are not a developer or the owner of this bot.`
              ),
          ],
          ephemeral: true,
        });
      }

      if (!input)
        return interaction.reply({
          content: `What do I evaluate?`,
          ephemeral: true,
        });
      if (!input.toLowerCase().includes("token")) {
        let embed = ``;

        try {
          let output = eval(input);
          if (typeof output !== "string")
            output = require("util").inspect(output, { depth: 0 });

          embed = `\`\`\`js\n${
            output.length > 1024 ? "Too large to display." : output
          }\`\`\``;
        } catch (err) {
          embed = `\`\`\`js\n${
            err.length > 1024 ? "Too large to display." : err
          }\`\`\``;
        }

        interaction.reply({ content: embed, ephemeral: true });
      } else {
        interaction.reply("Bruh you tryna steal my token huh?");
      }
    } else if (subcommand === "exec") {
      await interaction.deferReply({ ephemeral: true });
      const thing = interaction.options.getString("thing-to-exec");

      if (
        !config.owner.includes(interaction.user.id) &&
        (config.developers.includes(interaction.user.id) ||
          !config.developers.includes(interaction.user.id))
      ) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(client.color.red)
              .setDescription(
                `${client.emoji.fail} | This command is for the owner.`
              ),
          ],
          ephemeral: true,
        });
      }

      if (thing.toLowerCase().includes("config.json")) {
        return interaction.editReply({
          content:
            "Due to privacy reasons, we can't show the config.json file.",
          ephemeral: true,
        });
      }

      if (thing.length < 1) {
        return interaction.editReply({
          content: "You have to give me some text to execute!",
          ephemeral: true,
        });
      }

      interaction.editReply({
        content: `Please wait while the command is being processed... This may take a while.`,
        fetchReply: true,
        ephemeral: true,
      });

      exec(thing, (error, stdout) => {
        const response = stdout || error;
        interaction.editReply({
          content: `\`\`\`bash\n${response}\n\`\`\``,
          ephemeral: true,
        });
      });
    } else if (subcommand === "fetchinvite") {
      const guildId = interaction.options.getString("guild");
      const guild = client.guilds.cache.get(guildId);

      if (!guild) return interaction.reply({ content: `Invalid Guild ID` });

      if (
        !config.owner.includes(interaction.user.id) &&
        !config.developers.includes(interaction.user.id)
      ) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(client.color.red)
              .setDescription(
                `${client.emoji.fail} | You are not a developer or the owner of this bot.`
              ),
          ],
          ephemeral: true,
        });
      }

      var textChats = guild.channels.cache.find(
        (ch) =>
          ch.type === "GUILD_TEXT" &&
          ch.permissionsFor(guild.members.me).has("CREATE_INSTANT_INVITE")
      );

      if (!textChats) return interaction.reply({ content: `No channel` });

      await textChats
        .createInvite({
          maxAge: 0,
          maxUses: 0,
        })
        .then((inv) => {
          console.log(`${guild.name} | ${inv.url}`);
          interaction.reply({ content: `${guild.name} | ${inv.url}` });
        })
        .catch(() => {
          interaction.reply({
            content: "I do not have permission to do that!",
            ephemeral: true,
          });
        });
    } else if (subcommand === "leaveguild") {
      const guildId = interaction.options.getString("guild");
      const guild = client.guilds.cache.get(guildId);
      if (!guild)
        return interaction.reply({
          content: `Invalid Guild ID`,
          ephemeral: true,
        });

      await interaction.deferReply({ ephemeral: true });

      if (
        !config.owner.includes(interaction.user.id) &&
        (config.developers.includes(interaction.user.id) ||
          config.developers.includes(interaction.user.id))
      ) {
        return interaction.editReply({
          embeds: [
            new MessageEmbed()
              .setColor(client.color.red)
              .setDescription(
                `${client.emoji.fail} | This command is for the owner.`
              ),
          ],
          ephemeral: true,
        });
      }

      await guild.leave();
      const embed = new MessageEmbed()
        .setTitle("Leave Guild")
        .setDescription(`I have successfully left **${guild.name}**.`)
        .setFooter({
          text: interaction.member.displayName,
          iconURL: interaction.member.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp()
        .setColor(interaction.guild.members.me.displayHexColor);
      interaction.editReply({ embeds: [embed], ephemeral: true });
    } else if (subcommand === "stop") {
      const client = client;
      const userId = interaction.user.id;

      if (
        !config.owner.includes(userId) &&
        (config.developers.includes(userId) ||
          !config.developers.includes(userId))
      ) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(client.color.red)
              .setDescription(
                "You do not have permission to execute this command."
              ),
          ],
          ephemeral: true,
        });
      }

      const force = interaction.options.getBoolean("force") ?? false;
      const silent = interaction.options.getBoolean("silent") ?? false;

      const embed = new MessageEmbed()
        .setColor("#36393f")
        .setTitle("Stop Command Initiated")
        .addFields(
          { name: "Executor", value: interaction.user.tag, inline: true },
          {
            name: "Mode",
            value: force ? "Force Stop" : "Graceful Shutdown",
            inline: true,
          }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });

      const shutdown = async () => {
        if (!silent) {
          console.log(`Stop command executed by ${interaction.user.tag}`);
          console.log(`Options: force=${force}, silent=${silent}`);
        }

        exec("lsof -ti:4000 | xargs kill -9", async (error) => {
          if (error && !silent) {
            console.error("Port kill failed:", error);
            embed.addFields({
              name: "Port Kill Status",
              value: "Failed to kill port 4000, proceeding with shutdown",
            });
          } else if (!silent) {
            embed.addFields({
              name: "Port Kill Status",
              value: "Port 4000 successfully terminated",
            });
          }

          if (!force) {
            try {
              await client.destroy();
            } catch (err) {
              if (!silent) {
                console.error("Error during client destroy:", err);
                embed.addFields({
                  name: "Shutdown Status",
                  value: "Error during graceful shutdown, forcing exit",
                });
              }
            }
          }

          if (!silent) {
            embed.addFields({
              name: "Final Status",
              value: "Bot shutdown complete",
            });
            await interaction.editReply({ embeds: [embed] });
          }

          process.exit(force ? 1 : 0);
        });
      };

      shutdown().catch((err) => {
        if (!silent) {
          console.error("Unexpected shutdown error:", err);
        }
        process.exit(1);
      });
    } else if (subcommand === "server") {
      function checkDays(date) {
        let now = new Date();
        let diff = now.getTime() - date.getTime();
        let days = Math.floor(diff / 86400000);
        return days + (days == 1 ? " day" : " days") + " ago";
      }
      const client = client;
      const guildId = interaction.options.getString("guild");
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return interaction.reply({ content: `Invalid guild ID` });

      if (
        !config.owner.includes(interaction.user.id) &&
        (config.developers.includes(interaction.user.id) ||
          !config.developers.includes(interaction.user.id))
      ) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(client.color.red)
              .setDescription(
                `${client.emoji.fail} | This command is for the owner.`
              ),
          ],
          ephemeral: true,
        });
      }

      const embed = new MessageEmbed()
        .setAuthor({ name: guild.name, iconURL: guild.iconURL() })
        .addFields(
          { name: "Server ID", value: `${guild.id}`, inline: true },
          {
            name: "Total | Humans | Bots",
            value: `${guild.members.cache.size} | ${
              guild.members.cache.filter((member) => !member.user.bot).size
            } | ${
              guild.members.cache.filter((member) => member.user.bot).size
            }`,
            inline: true,
          },
          {
            name: "Verification Level",
            value: `${guild.verificationLevel}`,
            inline: true,
          },
          {
            name: "Channels",
            value: `${guild.channels.cache.size}`,
            inline: true,
          },
          { name: "Roles", value: `${guild.roles.cache.size}`, inline: true },
          {
            name: "Creation Date",
            value: `${guild.createdAt.toUTCString().substr(0, 16)} (${checkDays(
              guild.createdAt
            )})`,
            inline: true,
          }
        )
        .setThumbnail(guild.iconURL())
        .setColor(interaction.guild.members.me.displayHexColor);
      interaction.reply({ embeds: [embed] }).catch((error) => {
        interaction.reply({ content: `Error: ${error}` });
      });
    } else if (subcommand === "servers") {
      const servers = client.guilds.cache.map((guild) => {
        return `\`${guild.id}\` - ${guild.name} - \`${guild.memberCount}\` members`;
      });

      if (
        !config.owner.includes(interaction.user.id) &&
        (config.developers.includes(interaction.user.id) ||
          !config.developers.includes(interaction.user.id))
      ) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(client.color.red)
              .setDescription(
                `${client.emoji.fail} | You are not a developer or the owner of this bot.`
              ),
          ],
          ephemeral: true,
        });
      }

      const embed = new MessageEmbed()
        .setTitle("Server List")
        .setFooter({
          text: interaction.user.displayName,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp()
        .setColor(interaction.user.displayHexColor);

      if (servers.length <= 50) {
        const range = servers.length == 1 ? "[1]" : `[1 - ${servers.length}]`;
        embed
          .setTitle(`Server List ${range}`)
          .setDescription(servers.join("\n"));
        interaction.reply({ embeds: [embed], ephemeral: true });
      } else {
        interaction.reply({
          content: `I am currently in ${servers.length} servers.`,
        });
        new ReactionMenu(
          client,
          interaction.channel,
          interaction.user,
          embed,
          servers
        );
      }
    } else if (subcommand === "setnews") {
      if (
        !config.owner.includes(interaction.user.id) &&
        (config.developers.includes(interaction.user.id) ||
          !config.developers.includes(interaction.user.id))
      ) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(client.color.red)
              .setDescription(
                `${client.emoji.fail} | This command is for the owner.`
              ),
          ],
          ephemeral: true,
        });
      }

      let news = interaction.options.getString("text");
      const newsDB = await NewsSchema.findOne({});
      if (!newsDB) {
        await NewsSchema.create({
          news: news,
          time: new Date(),
        });

        return interaction.reply({ content: "News set.", ephemeral: true });
      }

      await NewsSchema.findOneAndUpdate(
        {},
        {
          news: news,
          time: new Date(),
        }
      );
    }
  },
};
