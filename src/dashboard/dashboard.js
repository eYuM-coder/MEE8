require("dotenv").config();

const Discord = require("discord.js");
const url = require("url");
const path = require("path");
let uniqid = require("uniqid");
const config = require("../../config.json");
const cooldownNickname = new Set();
const express = require("express");
const passport = require("passport");
const jsonconfig = require("../../config.json");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const Strategy = require("./passport").Strategy;
const premiumWeb = new Discord.WebhookClient({
  url: jsonconfig.webhooks.premium,
});
const ejs = require("ejs");
const ShortUrl = require("../database/models/ShortUrl.js");
const randoStrings = require("../packages/randostrings.js");
const random = new randoStrings();
const sendingEmbed = new Set();
const bodyParser = require("body-parser");
const { MessageEmbed } = require("discord.js");
const DBL = require("@top-gg/sdk");
const User = require("../database/schemas/User");
const TicketSettings = require("../database/models/tickets");
const ReactionRole = require("../packages/reactionrole/models/schema");
const ReactionRoles = require("../packages/reactionrole/index.js");
const reactP = new ReactionRoles();
const EmojiArray = require("../assets/json/emojiarray.json");
const Maintenance = require("../database/schemas/maintenance");
const webhook = new DBL.Webhook(process.env.DBL_AUTH);
const fetch = require("node-fetch");
const Paste = require("../database/models/transcript.js");
const moment = require("moment");
const cooldownEmbed = new Set();
const metrics = require("datadog-metrics");
const { cpu } = require("node-os-utils");
const Application = require("../database/models/application/application.js");
const customCommand = require("../database/schemas/customCommand.js");

const Hook = new Discord.WebhookClient({ url: jsonconfig.webhooks.votes });

let rgx =
  /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;

let GuildSettings = require("../database/schemas/Guild");
let WelcomeSchema = require("../database/schemas/welcome");
let LeaveSchema = require("../database/schemas/leave");
let StickySettings = require("../database/schemas/stickyRole");
let AltSettings = require("../database/models/altdetector.js");
let Logging = require("../database/schemas/logging");
let App = require("../database/models/application/application.js");
const logger = require("../utils/logger");

const domain = process.env.AUTH_DOMAIN;
const clientID = process.env.AUTH_CLIENT_ID;
const secret = process.env.AUTH_CLIENT_SECRET;
const port = process.env.PORT || 3000;

const app = express();
app.use(express.static("src/dashboard/static"));

module.exports = async (client) => {
  const dataDir = path.resolve(`${process.cwd()}${path.sep}src/dashboard`);
  const templateDir = path.resolve(`${dataDir}${path.sep}templates`);

  passport.serializeUser((user, done) => {
    if (!user) return;
    return done(null, user);
  });
  passport.deserializeUser((obj, done) => done(null, obj));

  passport.use(
    new Strategy(
      {
        clientID: `${clientID}`,
        clientSecret: `${secret}`,
        callbackURL: `${domain}/callback`,
        scope: ["identify", "guilds"],
      },
      async (accessToken, refreshToken, profile, cb) => {
        await process.nextTick(async () => {
          if (profile.guilds == undefined) return cb(null, false);

          return cb(null, profile);
        });
      }
    )
  );

  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: true,
      saveUninitialized: true,
      store: MongoStore.create({ mongoUrl: process.env.MONGO }),
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.locals.domain = domain.split("//")[1];

  app.engine("html", ejs.renderFile);
  app.set("view engine", "html");

  app.use(bodyParser.json());
  app.use(
    bodyParser.urlencoded({
      extended: true,
    })
  );

  const renderTemplate = (res, req, template, data = {}) => {
    var pathname = url.parse(req.url).pathname;

    const baseData = {
      https: "https://",
      domain: domain,
      bot: client,
      clientID: process.env.MAIN_CLIENT_ID,
      pathname: pathname,
      path: req.path,
      user: req.isAuthenticated() ? req.user : null,
      url: res,
      req: req,
      image: `${domain}/logo.png`,
      analytics: process.env.ANALYTICS,
      seo: jsonconfig.seo.enabled ? true : false,
      description: jsonconfig.seo.enabled ? jsonconfig.seo.description : false,
      title: jsonconfig.seo.enabled ? jsonconfig.seo.title : false,
      verification: process.env.GOOGLE_SITE_VERIFICATION || false,
    };
    res.render(
      path.resolve(`${templateDir}${path.sep}${template}`),
      Object.assign(baseData, data)
    );
  };

  const checkAuth = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    req.session.backURL = req.url;
    res.redirect("/login");
  };

  app.get(
    "/login",
    (req, res, next) => {
      if (req.headers.referer) {
        const parsed = url.parse(req.headers.referer);
        if (parsed.hostname === app.locals.domain) {
          req.session.backURL = parsed.path;
        }
      } else {
        req.session.backURL = "/";
      }

      next();
    },
    passport.authenticate("discord")
  );

  app.get(
    "/callback",
    function (req, res, next) {
      return passport.authenticate(
        "discord",
        { failureRedirect: "/" },
        async function (err, user) {
          if (err) {
            console.error(err);
            return res.redirect("/");
          }

          await req.login(user, function (e) {
            if (e) return next(e);
            return next();
          });
        }
      )(req, res, next);
    },
    async function (req, res) {
      const loginLogs = new Discord.WebhookClient({
        url: jsonconfig.webhooks.auth,
      });

      try {
        const login = new MessageEmbed()
          .setColor("GREEN")
          .setTitle(`Login Logs`)
          .setDescription(
            `\nUser: ${req.user.username}#${req.user.discriminator} \`(${
              req.user.id
            })\`\nTime: ${moment(new Date()).format(
              "dddd, MMMM Do YYYY HH:mm:ss"
            )} `
          );

        loginLogs.sendCustom({
          username: "Login Logs",
          avatarURL: `${domain}/logo.png`,
          embeds: [login],
        });

        const url = req.session.backURL;
        if (url) {
          res.redirect(url);
        } else {
          res.redirect("/");
        }
      } catch (err) {
        res.redirect("/");
      }
    }
  );

  app.get(
    "/callback",
    passport.authenticate("discord", {
      failWithError: true,
      failureFlash: "There was an error logging you in!",
      failureRedirect: "/",
    }),
    async (req, res) => {
      const loginLogs = new Discord.WebhookClient({
        url: jsonconfig.webhooks.auth,
      });

      try {
        if (req.session.backURL) {
          const url = req.session.backURL;
          req.session.backURL = null;
          res.redirect(url);

          const member = await client.users.fetch(req.user.id);
          if (member) {
            const login = new MessageEmbed()
              .setColor("GREEN")
              .setTitle(`Login Logs`)
              .setDescription(
                `\nUser: ${member.tag}\`(${member.id})\`\nTime: ${moment(
                  new Date()
                ).format("dddd, MMMM Do YYYY HH:mm:ss")} `
              );

            loginLogs.sendCustom({
              username: "Login Logs",
              avatarURL: `${domain}/logo.png`,
              embeds: [login],
            });
          }
        } else {
          const member = await client.users.fetch(req.user.id);
          if (member) {
            const login = new MessageEmbed()
              .setColor("GREEN")
              .setTitle(`Login Logs`)
              .setDescription(
                `\nUser: ${member.tag}\`(${member.id})\`\nTime: ${moment(
                  new Date()
                ).format("dddd, MMMM Do YYYY HH:mm:ss")} `
              );

            loginLogs.sendCustom({
              username: "Login Logs",
              avatarURL: `${domain}/logo.png`,
              embeds: [login],
            });
          }

          res.redirect("/");
        }
      } catch (err) {
        res.redirect("/");
      }
    }
  );

  app.get("/commands", (req, res) => {
    renderTemplate(res, req, "commands.ejs", { botName: config.botName });
  });

  app.get("/color", (req, res) => {
    var url = req.protocol + "://" + req.get("host") + req.originalUrl;
    renderTemplate(res, req, "color.ejs", {
      urlSite: url,
      botName: config.botName,
    });
  });

  app.get("/faq", (req, res) => {
    renderTemplate(res, req, "faq.ejs", { botName: config.botName });
  });
  app.get("/docs", (req, res) => {
    renderTemplate(res, req, "docs.ejs", { botName: config.botName });
  });

  app.get("/stats", (req, res) => {
    renderTemplate(res, req, "stats.ejs", { botName: config.botName });
  });

  app.get("/variables", (req, res) => {
    renderTemplate(res, req, "variables.ejs", { botName: config.botName });
  });
  app.get("/transcript", (req, res) => {
    renderTemplate(res, req, "maintranscript.ejs", { botName: config.botName });
  });
  app.get("/manage", (req, res) => {
    renderTemplate(res, req, "manage.ejs", { botName: config.botName });
  });
  app.get("/embeds", (req, res) => {
    renderTemplate(res, req, "embeds.ejs", { botName: config.botName });
  });

  app.get("/support", (req, res) => {
    res.redirect(`${jsonconfig.discord}`);
  });

  app.get("/server", (req, res) => {
    res.redirect(`${jsonconfig.discord}`);
  });

  app.get("/invite", function (req, res) {
    res.redirect(jsonconfig.invite_link);
  });

  app.get("/thanks", function (req, res) {
    renderTemplate(res, req, "thanks.ejs", { botName: config.botName });
  });

  app.get("/team", (req, res) => {
    renderTemplate(res, req, "team.ejs", { botName: config.botName });
  });

  app.get("/policy", (req, res) => {
    renderTemplate(res, req, "policy.ejs", { botName: config.botName });
  });

  app.get("/terms", (req, res) => {
    renderTemplate(res, req, "terms.ejs", { botName: config.botName });
  });

  app.get("/logout", async function (req, res) {
    if (req.user) {
      const logoutLogs = new Discord.WebhookClient({
        url: jsonconfig.webhooks.auth,
      });

      const logout = new MessageEmbed()
        .setColor("RED")
        .setTitle(`Logout Logs`)
        .setDescription(
          `\nUser: ${req.user.username}#${req.user.discriminator} \`(${
            req.user.id
          })\`\nTime: ${moment(new Date()).format(
            "dddd, MMMM Do YYYY HH:mm:ss"
          )}`
        );

      logoutLogs.send({
        username: "Logout Logs",
        avatarURL: `${domain}/logo.png`,
        embeds: [logout],
      });
    }

    req.session.destroy(() => {
      req.logout();
      res.redirect("/");
    });
  });
  app.get("/window", (req, res) => {
    renderTemplate(res, req, "window.ejs", { botName: config.botName });
  });

  app.get("/premium", (req, res) => {
    renderTemplate(res, req, "premium.ejs", { botName: config.botName });
  });
  app.get("/changelog", (req, res) => {
    renderTemplate(res, req, "changelog.ejs", { botName: config.botName });
  });

  app.get("/", async (req, res) => {
    renderTemplate(res, req, "index.ejs", { botName: config.botName });
  });

  app.get("/apply", checkAuth, (req, res) => {
    renderTemplate(res, req, "appeal.ejs", {
      perms: Discord.Permissions,
      botName: config.botName,
    });
  });
  app.get("/paste", (req, res) => {
    res.send(`Working`);
  });

  app.get("/url/:shortUrl", async (req, res) => {
    const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl });
    if (shortUrl == null) return res.send("Invalid url Provided");

    shortUrl.clicks++;
    shortUrl.save();

    res.redirect(shortUrl.full);
  });

  app.get("/url", async (req, res) => {
    renderTemplate(res, req, "url.ejs", { botName: config.botName });
  });

  const pastes = await Paste.find({
    type: "ticket",
    botName: config.botName,
  });

  for (const pasteE of pastes) {
    if (pasteE.createdAt > pasteE.expiresAt) {
      await pasteE.deleteOne().catch(() => {});
    }
  }
  app.get("/paste/:pasteID", async (req, res) => {
    const paste = await Paste.findOne({
      _id: req.params.pasteID,
      type: "ticket",
    });
    if (paste) {
      if (paste && paste.paste.length >= 1) {
        if (paste.createdAt > paste.expiresAt) {
          await paste.deleteOne().catch(() => {});

          renderTemplate(res, req, "paste.ejs", {
            type: "noFind",
          });
          return;
        }

        renderTemplate(res, req, "paste.ejs", {
          expires: moment(paste.expiresAt).format(
            "dddd, MMMM Do YYYY HH:mm:ss"
          ),
          created: moment(paste.createdAt).format(
            "dddd, MMMM Do YYYY HH:mm:ss"
          ),
          paste: paste.paste,
          id: paste._id,
          db: paste,
          closedBy: client.users.cache.get(paste.by),
          type: "ticket",
        });
      } else {
        renderTemplate(res, req, "paste.ejs", {
          type: "noFind",
        });
      }
    } else {
      const form = await Paste.findOne({
        _id: req.params.pasteID,
        type: "form",
      });

      if (form && form.paste.length >= 1) {
        if (form.createdAt > form.expiresAt) {
          await form.deleteOne().catch(() => {});

          renderTemplate(res, req, "paste.ejs", {
            type: "noFindForm",
          });
          return;
        }

        renderTemplate(res, req, "paste.ejs", {
          expires: moment(form.expiresAt).format("dddd, MMMM Do YYYY HH:mm:ss"),
          created: moment(form.createdAt).format("dddd, MMMM Do YYYY HH:mm:ss"),
          db: form,
          id: form._id,
          type: "form",
        });
      } else {
        renderTemplate(res, req, "paste.ejs", {
          type: "noFindForm",
        });
      }
    }
  });

  app.get("/apply/:guildID", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");

    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }

    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }

    let db = await Application.findOne({
      guildID: guild.id,
    });

    if (!db) {
      let newAppDB = new app({
        guildID: guild.id,
        questions: [],
        appToggle: false,
        appLogs: null,
      });
      await newAppDB.save().catch(() => {});

      db = await Application.findOne({
        guildID: guild.id,
      });
    }

    renderTemplate(res, req, "appealMain.ejs", {
      guild: guild,
      alert: null,
      app: db,
      settings: storedSettings,
    });
  });

  app.post("/apply/:guildID", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");

    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }

    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }

    let db = await Application.findOne({
      guildID: guild.id,
    });

    if (!db) {
      let newAppDB = new app({
        guildID: guild.id,
        questions: [],
        appToggle: false,
        appLogs: null,
      });
      await newAppDB.save().catch(() => {});

      db = await Application.findOne({
        guildID: guild.id,
      });
    }
    const data = req.body;

    const channel = await guild.channels.cache.get(db.appLogs);

    if (db.appToggle === false) return;

    if (channel) {
      let embed;

      let ticketID = random.password({
        length: 8,
        string: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
      });

      let form = new Paste({
        _id: ticketID,
        by: member.id,
        type: "form",
        expiresAt: new Date(Date.now() + 2629800000),
      });

      for (let i = 0; db.questions.length > i; i++) {
        if (data[i + 1]) {
          form.paste.push(`Question #${i + 1} - ${db.questions[i]}`);
          form.paste2.push(`${data[i + 1] || "Not Answered"}`);

          embed = new MessageEmbed()
            .setTitle(`A new Form was Submitted`)
            .setDescription(
              `**Link:** [${domain}/paste/${ticketID}](${domain}/paste/${ticketID})\n\n[or click here](${domain}/paste/${ticketID})\n\n**Form ID**: \`${ticketID}\`\n\n**Submitted by:** ${member} **(${
                member.user.tag
              } - ${member.id})**\n**Time:** ${moment(new Date()).format(
                "dddd, MMMM Do YYYY HH:mm:ss"
              )}`
            )
            .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
            .setColor("GREEN");
        } else {
          form.paste.push(`Question #${i + 1} - ${db.questions[i]}`);
          form.paste2.push(`Not Answered`);

          embed = new MessageEmbed()
            .setTitle(`A new Form was Submitted`)
            .setDescription(
              `**Link:** [${domain}/paste/${ticketID}](${domain}/paste/${ticketID})\n\n[or click here](${domain}/paste/${ticketID})\n\n**Form ID**: \`${ticketID}\`\n\n**Submitted by:** ${member} **(${
                member.user.tag
              } - ${member.id})**\n**Time:** ${moment(new Date()).format(
                "dddd, MMMM Do YYYY HH:mm:ss"
              )}`
            )
            .setFooter({ text: `${process.env.AUTH_DOMAIN}` })
            .setColor("GREEN");
        }
      }
      member
        .sendCustom({
          embeds: [
            new MessageEmbed()
              .setColor("GREEN")
              .setFooter({ text: `Powered by ${process.env.AUTH_DOMAIN}/` })
              .setTitle(`Application #${ticketID}`)
              .setDescription(
                `Hey ${
                  member.user.username
                }! Your form was Submitted and ready to be judged.\n\n**Form ID**: \`${ticketID}\`\n**Time:** ${moment(
                  new Date()
                ).format("dddd, MMMM Do YYYY HH:mm:ss")}`
              ),
          ],
        })
        .catch(() => {});

      await form.save().catch(() => {});
      channel.send({ embeds: [embed] });

      renderTemplate(res, req, "appealMain.ejs", {
        guild: guild,
        alert: `Your form has been recieved`,
        id: `Form #${ticketID}`,
        app: db,
        settings: storedSettings,
      });

      return;
    } else {
      renderTemplate(res, req, "appealMain.ejs", {
        guild: guild,
        alert: `There was an error sending your Form.`,
        app: db,
        settings: storedSettings,
      });

      return;
    }
  });
  app.get("/redeem", checkAuth, (req, res) => {
    renderTemplate(res, req, "redeem.ejs", {
      perms: Discord.Permissions,
    });
  });

  app.get("/dashboard", checkAuth, (req, res) => {
    const server = client.guilds.cache.get(jsonconfig.server);
    if (!server) {
      return renderTemplate(res, req, "dashboard.ejs", {
        perms: Discord.Permissions,
        userExists: false,
        botName: config.botName,
      });
    }

    let user = server.members.cache.get(req.user.id);
    renderTemplate(res, req, "dashboard.ejs", {
      perms: Discord.Permissions,
      userExists: user ? true : false,
      botName: config.botName,
    });
  });

  app.get("/redeem/:guildID", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/redeem");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/redeem");
    if (!member.permissions.has("MANAGE_GUILD")) return res.redirect("/redeem");

    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }

    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }

    renderTemplate(res, req, "redeemguild.ejs", {
      guild: guild,
      alert: null,
      settings: storedSettings,
    });
  });

  app.post("/redeem/:guildID", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/redeem");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/redeem");
    if (!member.permissions.has("MANAGE_GUILD")) return res.redirect("/redeem");

    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }

    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }

    const expires = moment(Date.now() + 2592000000 * 12).format(
      "dddd, MMMM Do YYYY HH:mm:ss"
    );

    let ID = uniqid(undefined, ``);
    const date = require("date-and-time");
    const now = new Date();
    let DDate = date.format(now, "YYYY/MM/DD HH:mm:ss");
    member
      .send({
        embeds: [
          new Discord.MessageEmbed()
            .setDescription(
              `**Congratulations!**\n\n**${guild.name}** Is now a premium guild! Thanks a ton!\n\nIf you have any questions please contact me [here](${jsonconfig.discord})\n\n__**Receipt:**__\n**Receipt ID:** ${ID}\n**Redeem Date:** ${DDate}\n**Guild Name:** ${guild.name}\n**Guild ID:** ${guild.id}\n\n**Please make sure to keep this information safe, you might need it if you ever wanna refund / transfer servers.**\n\n**Expires At:** ${expires}`
            )
            .setColor("GREEN")
            .setFooter({ text: guild.name }),
        ],
      })
      .catch(() => {});

    storedSettings.isPremium = "true";
    storedSettings.premium.redeemedBy.id = member.id;
    storedSettings.premium.redeemedBy.tag = member.user.tag;
    storedSettings.premium.redeemedAt = Date.now();
    storedSettings.premium.expiresAt = Date.now() + 2592000000 * 12;
    storedSettings.premium.plan = "year";

    await storedSettings.save().catch(() => {});

    const embedPremium = new Discord.MessageEmbed()
      .setDescription(
        `**Premium Subscription**\n\n**${member.user.tag}** Redeemed a code in **${guild.name}**\n\n **Receipt ID:** ${ID}\n**Redeem Date:** ${DDate}\n**Guild Name:** ${guild.name}\n**Guild ID:** ${guild.id}\n**Redeemer Tag:** ${member.user.tag}\n**Redeemer ID:** ${member.user.id}\n\n**Expires At:** ${expires}`
      )
      .setColor(guild.members.me.displayHexColor);

    premiumWeb.send({
      username: `${jsonconfig.botName} Premium`,
      avatarURL: `${domain}/logo.png`,
      embeds: [embedPremium],
    });
    renderTemplate(res, req, "redeemguild.ejs", {
      guild: guild,
      alert: `${guild.name} Is now a premium guild!!`,
      settings: storedSettings,
    });
  });

  app.get("/dashboard/:guildID", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD"))
      return res.redirect("/dashboard");

    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }

    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }

    const join1 = [];
    const leave1 = [];
    const join2 = [];
    const leave2 = [];

    guild.members.cache.forEach(async (user) => {
      let x = Date.now() - user.joinedAt;
      let created = Math.floor(x / 86400000);

      if (7 > created) {
        join2.push(user.id);
      }

      if (1 > created) {
        join1.push(user.id);
      }
    });

    storedSettings.leaves.forEach(async (leave) => {
      let xx = leave - Date.now();
      if (Date.now() > leave) {
        xx = Date.now() - leave;
      }

      let createdd = Math.floor(xx / 86400000);

      if (6 >= createdd) {
        leave2.push(leave);
      }

      if (0 >= createdd) {
        leave1.push(leave);
      }
    });

    renderTemplate(res, req, "./new/mainpage.ejs", {
      guild: guild,
      alert: `Dashboard and bot hosted by eYuM (https://eyum.org)`,
      join1: join1.length || 0,
      join2: join2.length || 0,
      leave1: leave1.length || 0,
      leave2: leave2.length || 0,
      nickname: guild.members.nickname || guild.members.me.user.username,
      settings: storedSettings,
    });
  });

  app.post("/dashboard/:guildID", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD"))
      return res.redirect("/dashboard");

    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }
    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }

    const join1 = [];
    const leave1 = [];
    const join2 = [];
    const leave2 = [];

    guild.members.cache.forEach(async (user) => {
      let x = Date.now() - user.joinedAt;
      let created = Math.floor(x / 86400000);

      if (7 > created) {
        join2.push(user.id);
      }

      if (1 > created) {
        join1.push(user.id);
      }
    });

    storedSettings.leaves.forEach(async (leave) => {
      let xx = leave - Date.now();
      if (Date.now() > leave) {
        xx = Date.now() - leave;
      }

      let createdd = Math.floor(xx / 86400000);

      if (6 >= createdd) {
        leave2.push(leave);
      }

      if (0 >= createdd) {
        leave1.push(leave);
      }
    });

    let data = req.body;
    let nickname = data.nickname;
    if (nickname && nickname.length < 1)
      nickname = guild.members.nickname || guild.members.me.user.username;

    if (data.nickname) {
      if (cooldownNickname.has(guild.id))
        nickname = guild.members.nickname || guild.members.me.user.username;
      if (!nickname) nickname = guild.members.nickname || guild.members.me.user.username;

      guild.members.me.setNickname(nickname);
      cooldownNickname.add(guild.id);
      setTimeout(() => {
        cooldownNickname.delete(guild.id);
      }, 20000);
    }

    if (data.prefix) {
      let prefix = data.prefix.replace(/ /g, "");
      if (!prefix) prefix = storedSettings.prefix;
      if (prefix.length > 5) {
        renderTemplate(res, req, "./new/mainpage.ejs", {
          guild: guild,
          nickname: nickname,
          join1: join1.length || 0,
          join2: join2.length || 0,
          leave1: leave1.length || 0,
          leave2: leave2.length || 0,
          alert: "Prefix length exceeds 5 characters ❌",
          settings: storedSettings,
        });
        return;
      }
      storedSettings.prefix = prefix;
    } else {
      storedSettings.prefix = jsonconfig.prefix;
    }

    if (data.language) {
      const languages = ["english", "french", "spanish", "arabic", "polish"];
      let language = data.language;
      if (!language) language = "english";
      if (!languages.includes(language)) language = "english";

      storedSettings.language = language;
    }

    await storedSettings.save().catch(() => {});

    renderTemplate(res, req, "./new/mainpage.ejs", {
      guild: guild,
      join1: join1.length || 0,
      join2: join2.length || 0,
      leave1: leave1.length || 0,
      leave2: leave2.length || 0,
      nickname: nickname,
      alert: "Your changes have been saved! ✅",
      settings: storedSettings,
    });
  });

  app.get("/dashboard/:guildID/applications", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD"))
      return res.redirect("/dashboard");

    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }

    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }

    var appSettings = await App.findOne({ guildID: guild.id });
    if (!appSettings) {
      const newSettings5 = new App({
        guildID: guild.id,
      });
      await newSettings5.save().catch(() => {});
      appSettings = await App.findOne({ guildID: guild.id });
    }

    renderTemplate(res, req, "./new/mainapp.ejs", {
      guild: guild,
      alert: null,
      app: appSettings,
      settings: storedSettings,
    });
  });

  app.post("/dashboard/:guildID/applications", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD"))
      return res.redirect("/dashboard");

    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }
    const data = req.body;

    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }

    var appSettings = await App.findOne({ guildID: guild.id });
    if (!appSettings) {
      const newSettings5 = new App({
        guildID: guild.id,
      });
      await newSettings5.save().catch(() => {});
      appSettings = await App.findOne({ guildID: guild.id });
    }

    if (Object.prototype.hasOwnProperty.call(data, "save")) {
      const channelV = await guild.channels.cache.find(
        (ch) => `#${ch.name}` === data.log
      );
      if (channelV) {
        appSettings.appLogs = channelV.id;
      } else {
        appSettings.appLogs = null;
      }

      let add = await guild.roles.cache.find(
        (r) => "@" + r.name === data.add_role
      );
      if (add) {
        appSettings.add_role = add.id;
      } else {
        appSettings.add_role = null;
      }

      let rem = await guild.roles.cache.find(
        (r) => "@" + r.name === data.remove_role
      );
      if (rem) {
        appSettings.remove_role = rem.id;
      } else {
        appSettings.remove_role = null;
      }

      let toggle = req.body["toggle"];
      if (toggle) {
        appSettings.appToggle = true;
      } else {
        appSettings.appToggle = false;
      }

      let dm = req.body["dm"];
      if (dm) {
        appSettings.dm = true;
      } else {
        appSettings.dm = false;
      }
    }
    const DiscordTranscripts = require("discord-transcripts");

    app.get("/dashboard/transcript/:serverId/:channelId", async (req, res) => {
      try {
        const { serverId, channelId } = req.params;

        const botToken = "YOUR_DISCORD_BOT_TOKEN";

        const transcripts = new DiscordTranscripts(botToken);

        const transcript = await transcripts.getChannelTranscript(
          serverId,
          channelId
        );

        res.render("transcript", { transcript });
      } catch (error) {
        console.error("Error fetching transcript:", error);

        res.status(500).send("Error fetching transcript");
      }
    });

    await appSettings.save().catch(() => {});
    renderTemplate(res, req, "./new/mainapp.ejs", {
      guild: guild,
      alert: `Your Changes have been saved ✅`,
      app: appSettings,
      settings: storedSettings,
    });
  });

  async function getDashboardData(req, guildId) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return { redirect: "/dashboard" };

    const member = await guild.members.fetch(req.user.id);
    if (!member || !member.permissions.has("MANAGE_GUILD"))
      return { redirect: "/dashboard" };

    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return { template: "maintenance.ejs" };
    }

    let storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }

    const commands = client.botCommands
      .filter((cmd) => cmd.category !== "dev")
      .map((cmd) => ({
        name: cmd.name,
        description: cmd.description || "No description provided.",
        category: cmd.category || "General",
        usage: cmd.usage || "No usage provided.",
        aliases: cmd.aliases && cmd.aliases.length ? cmd.aliases : ["None"],
        cooldown: cmd.cooldown || 5,
      }));

    const maxDescriptionLength = 100;

    const customCommands = await customCommand.find({ guildId: guild.id });
    const customCommandsMapped = customCommands.map((customCmd) => ({
      name: customCmd.name,
      description: customCmd.content
        ? customCmd.content.length > maxDescriptionLength
          ? customCmd.content.substring(0, maxDescriptionLength) + "..."
          : customCmd.content
        : "No description provided.",
      category: "Custom",
      usage: "Custom Command",
      aliases: ["None"],
      cooldown: 0,
      content: customCmd.content,
    }));

    const allCommands = [...commands, ...customCommandsMapped];

    return {
      guild,
      storedSettings,
      commands: allCommands,
    };
  }

  app.get("/dashboard/:guildID/commands", checkAuth, async (req, res) => {
    const dashboardData = await getDashboardData(req, req.params.guildID);

    if (dashboardData.redirect) return res.redirect(dashboardData.redirect);
    if (dashboardData.template)
      return renderTemplate(res, req, dashboardData.template);

    renderTemplate(res, req, "./new/maincommands.ejs", {
      guild: dashboardData.guild,
      alert: null,
      settings: dashboardData.storedSettings,
      commands: dashboardData.commands,
    });
  });

  app.post("/dashboard/:guildID/commands", checkAuth, async (req, res) => {
    const dashboardData = await getDashboardData(req, req.params.guildID);

    if (dashboardData.redirect) return res.redirect(dashboardData.redirect);
    if (dashboardData.template)
      return renderTemplate(res, req, dashboardData.template);

    renderTemplate(res, req, "./new/maincommands.ejs", {
      guild: dashboardData.guild,
      alert: null,
      settings: dashboardData.storedSettings,
      commands: dashboardData.commands,
    });
  });

  app.get("/dashboard/:guildID/welcome", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD"))
      return res.redirect("/dashboard");

    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }

    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }
    var welcomeSettings = await WelcomeSchema.findOne({ guildId: guild.id });
    if (!welcomeSettings) {
      const newSettings = new WelcomeSchema({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      welcomeSettings = await WelcomeSchema.findOne({ guildId: guild.id });
    }

    var leaveSettings = await LeaveSchema.findOne({ guildId: guild.id });
    if (!leaveSettings) {
      const newSettings = new LeaveSchema({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      leaveSettings = await LeaveSchema.findOne({ guildId: guild.id });
    }

    renderTemplate(res, req, "./new/mainwelcome.ejs", {
      guild: guild,
      alert: null,
      leave: leaveSettings,
      settings: storedSettings,
      welcome: welcomeSettings,
    });
  });

  app.post("/dashboard/:guildID/welcome", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD"))
      return res.redirect("/dashboard");

    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }

    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new WelcomeSchema({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }
    var welcomeSettings = await WelcomeSchema.findOne({ guildId: guild.id });
    if (!welcomeSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      welcomeSettings = await WelcomeSchema.findOne({ guildId: guild.id });
    }
    var leaveSettings = await LeaveSchema.findOne({ guildId: guild.id });
    if (!leaveSettings) {
      const newSettings = new LeaveSchema({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      leaveSettings = await LeaveSchema.findOne({ guildId: guild.id });
    }

    let data = req.body;

    if (Object.prototype.hasOwnProperty.call(data, "welcomeSave")) {
      let welcomeValid = await guild.channels.cache.find(
        (ch) => `# ${ch.name}` === data.welcomeChannel
      );

      if (welcomeValid) {
        welcomeSettings.welcomeChannel = guild.channels.cache.find(
          (ch) => `# ${ch.name}` === data.welcomeChannel
        ).id;
      } else {
        welcomeSettings.welcomeChannel = null;
      }
    }

    if (Object.prototype.hasOwnProperty.call(data, "leaveSave")) {
      let leaveValid = await guild.channels.cache.find(
        (ch) => `# ${ch.name}` === data.leaveChannel
      );

      if (leaveValid) {
        leaveSettings.leaveChannel = guild.channels.cache.find(
          (ch) => `# ${ch.name}` === data.leaveChannel
        ).id;
      } else {
        leaveSettings.leaveChannel = null;
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(data, "leaveEnable") ||
      Object.prototype.hasOwnProperty.call(data, "leaveUpdate")
    ) {
      let checkDM = req.body["leaveDM"];
      if (checkDM) {
        leaveSettings.leaveDM = true;
      } else {
        leaveSettings.leaveDM = false;
      }

      let checkIfEmbed = req.body["leaveEmbed"];

      if (checkIfEmbed) {
        let database = await guild.channels.cache.get(
          leaveSettings.leaveChannel
        );

        if (!database) {
          leaveSettings.leaveToggle = false;
          await leaveSettings.save().catch(() => {});

          renderTemplate(res, req, "./new/mainwelcome.ejs", {
            guild: guild,
            alert: `Please make sure to save the welcome Channel first ❌`,
            settings: storedSettings,
            welcome: welcomeSettings,
            leave: leaveSettings,
          });
          return;
        }
        leaveSettings.leaveEmbed = true;
      } else {
        let database = await guild.channels.cache.get(
          leaveSettings.leaveChannel
        );

        if (!database) {
          leaveSettings.leaveToggle = false;
          await leaveSettings.save().catch(() => {});

          renderTemplate(res, req, "./new/mainwelcome.ejs", {
            guild: guild,
            alert: `Please make sure to save the welcome Channel first ❌`,
            settings: storedSettings,
            welcome: welcomeSettings,
            leave: leaveSettings,
          });
          return;
        }

        if (data.leaveMessage) {
          if (data.leaveMessage.length > 2000) {
            renderTemplate(res, req, "./new/mainwelcome.ejs", {
              guild: guild,
              alert: `Please make sure text length is below 2000❌`,
              settings: storedSettings,
              welcome: welcomeSettings,
              leave: leaveSettings,
            });
            return;
          }

          leaveSettings.leaveMessage = data.leaveMessage;
        } else {
          renderTemplate(res, req, "./new/mainwelcome.ejs", {
            guild: guild,
            alert: `Please Provide me with a text ❌`,
            settings: storedSettings,
            welcome: welcomeSettings,
            leave: leaveSettings,
          });

          return;
        }

        leaveSettings.leaveToggle = true;
        leaveSettings.leaveChannel = database.id;
        leaveSettings.leaveEmbed = false;
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(data, "leaveEnableEmbed") ||
      Object.prototype.hasOwnProperty.call(data, "leaveUpdateEmbed")
    ) {
      let data = req.body;

      let checkDM = req.body["leaveDM"];
      if (checkDM) {
        leaveSettings.leaveDM = true;
      } else {
        leaveSettings.leaveDM = false;
      }

      let checkIfEmbed = req.body["leaveEmbed"];

      if (checkIfEmbed) {
        if (data.leave_author_name) {
          if (data.leave_author_name.length > 256) {
            renderTemplate(res, req, "./new/mainwelcome.ejs", {
              guild: guild,
              alert: `Please make sure the author length is below 200❌`,
              settings: storedSettings,
              welcome: welcomeSettings,
              leave: leaveSettings,
            });
            return;
          }

          leaveSettings.embed.author.name = data.leave_author_name;
        } else {
          leaveSettings.embed.author.name = ``;
        }

        if (data.leave_author_url) {
          if (
            rgx.test(data.leave_author_url) ||
            data.leave_author_url.toLowerCase() == "{useravatar}"
          ) {
            leaveSettings.embed.author.url = data.leave_author_url;
          } else {
            renderTemplate(res, req, "./new/mainwelcome.ejs", {
              guild: guild,
              alert: `Please make sure this is a valid URL❌`,
              settings: storedSettings,
              welcome: welcomeSettings,
              leave: leaveSettings,
            });
            return;
          }
        } else {
          leaveSettings.embed.author.url = ``;
        }

        if (data.leave_author_icon) {
          if (
            rgx.test(data.leave_author_icon) ||
            data.leave_author_icon.toLowerCase() == "{useravatar}"
          ) {
            leaveSettings.embed.author.icon = data.leave_author_icon;
          } else {
            renderTemplate(res, req, "./new/mainwelcome.ejs", {
              guild: guild,
              alert: `Please make sure this is a valid URL❌`,
              settings: storedSettings,
              welcome: welcomeSettings,
              leave: leaveSettings,
            });
            return;
          }
        } else {
          leaveSettings.embed.author.icon = ``;
        }

        if (data.leave_embedTitle) {
          if (data.leave_embedTitle.length > 200) {
            renderTemplate(res, req, "./new/mainwelcome.ejs", {
              guild: guild,
              alert: `Please make sure your title is under 200 characters long❌`,
              settings: storedSettings,
              welcome: welcomeSettings,
              leave: leaveSettings,
            });
            return;
          }

          leaveSettings.embed.title = data.leave_embedTitle;
        } else {
          renderTemplate(res, req, "./new/mainwelcome.ejs", {
            guild: guild,
            alert: `Please make sure to include a title❌`,
            settings: storedSettings,
            welcome: welcomeSettings,
            leave: leaveSettings,
          });
          return;
        }

        if (data.leave_embedTitleURL) {
          if (rgx.test(data.leave_embedTitleURL)) {
            leaveSettings.embed.titleURL = data.leave_embedTitleURL;
          } else {
            renderTemplate(res, req, "./new/mainwelcome.ejs", {
              guild: guild,
              alert: `Invalid Link Provided ❌`,
              settings: storedSettings,
              welcome: welcomeSettings,
              leave: leaveSettings,
            });
            return;
          }
        } else {
          leaveSettings.embed.titleURL = ``;
        }

        if (data.leave_embedDescription) {
          if (data.leave_embedDescription.length > 2000) {
            renderTemplate(res, req, "./new/mainwelcome.ejs", {
              guild: guild,
              alert: `Make sure the description is below 2000 characters long ❌`,
              settings: storedSettings,
              welcome: welcomeSettings,
              leave: leaveSettings,
            });

            return;
          }

          leaveSettings.embed.description = data.leave_embedDescription;
        } else {
          renderTemplate(res, req, "./new/mainwelcome.ejs", {
            guild: guild,
            alert: `Please provide a description ❌`,
            settings: storedSettings,
            welcome: welcomeSettings,
            leave: leaveSettings,
          });

          return;
        }

        if (data.leave_embedThumbnail) {
          if (rgx.test(data.leave_embedThumbnail)) {
            leaveSettings.embed.thumbnail = data.leave_embedThumbnail;
          } else {
            renderTemplate(res, req, "./new/mainwelcome.ejs", {
              guild: guild,
              alert: `Please provide a valid thumbnail❌`,
              settings: storedSettings,
              welcome: welcomeSettings,
              leave: leaveSettings,
            });

            return;
          }
        } else {
          leaveSettings.embed.thumbnail = ``;
        }

        if (data.leave_embedFooter) {
          if (data.leave_embedFooter.length > 1048) {
            renderTemplate(res, req, "./new/mainwelcome.ejs", {
              guild: guild,
              alert: `Make sure the footer is under 1000 characters long ❌`,
              settings: storedSettings,
              welcome: welcomeSettings,
              leave: leaveSettings,
            });

            return;
          }
          leaveSettings.embed.footer = data.leave_embedFooter;
        } else {
          leaveSettings.embed.footer = "";
        }

        if (data.leave_embedFooterIcon) {
          if (rgx.test(data.leave_embedFooterIcon)) {
            leaveSettings.embed.footerIcon = data.leave_embedFooterIcon;
          } else {
            renderTemplate(res, req, "./new/mainwelcome.ejs", {
              guild: guild,
              alert: `Invalid Footer Icon ❌`,
              settings: storedSettings,
              welcome: welcomeSettings,
              leave: leaveSettings,
            });

            return;
          }
        } else {
          leaveSettings.embed.footerIcon = "";
        }

        let timestamp = req.body["leave_timestamp"];
        if (timestamp) {
          leaveSettings.embed.timestamp = true;
        } else {
          leaveSettings.embed.timestamp = false;
        }

        if (data.leave_embedColor) {
          leaveSettings.embed.color = data.leave_embedColor;
        } else {
          leaveSettings.embed.color = `#000000`;
        }

        leaveSettings.leaveEmbed = true;
      } else {
        leaveSettings.leaveEmbed = false;
      }

      leaveSettings.leaveToggle = true;
    }

    if (
      Object.prototype.hasOwnProperty.call(data, "welcomeEnable") ||
      Object.prototype.hasOwnProperty.call(data, "welcomeUpdate")
    ) {
      let checkDM = req.body["dmUser"];
      if (checkDM) {
        welcomeSettings.welcomeDM = true;
      } else {
        welcomeSettings.welcomeDM = false;
      }

      let checkIfEmbed = req.body["isEmbed"];

      if (checkIfEmbed) {
        let database = await guild.channels.cache.get(
          welcomeSettings.welcomeChannel
        );

        if (!database) {
          welcomeSettings.welcomeToggle = false;
          await welcomeSettings.save().catch(() => {});

          renderTemplate(res, req, "./new/mainwelcome.ejs", {
            guild: guild,
            alert: `Please make sure to save the welcome Channel first ❌`,
            settings: storedSettings,
            welcome: welcomeSettings,
            leave: leaveSettings,
          });
          return;
        }
        welcomeSettings.welcomeEmbed = true;
      } else {
        let database = await guild.channels.cache.get(
          welcomeSettings.welcomeChannel
        );

        if (!database) {
          welcomeSettings.welcomeToggle = false;
          await welcomeSettings.save().catch(() => {});
          renderTemplate(res, req, "./new/mainwelcome.ejs", {
            guild: guild,
            alert: `Please make sure to save the welcome Channel first ❌`,
            settings: storedSettings,
            welcome: welcomeSettings,
            leave: leaveSettings,
          });
          return;
        }

        if (data.welcomeMessage) {
          if (data.welcomeMessage.length > 2000) {
            renderTemplate(res, req, "./new/mainwelcome.ejs", {
              guild: guild,
              alert: `Please make sure text length is below 2000❌`,
              settings: storedSettings,
              welcome: welcomeSettings,
              leave: leaveSettings,
            });
            return;
          }

          welcomeSettings.welcomeMessage = data.welcomeMessage;
        } else {
          renderTemplate(res, req, "./new/mainwelcome.ejs", {
            guild: guild,
            alert: `Please Provide me with a text ❌`,
            settings: storedSettings,
            welcome: welcomeSettings,
            leave: leaveSettings,
          });

          return;
        }

        welcomeSettings.welcomeToggle = true;
        welcomeSettings.welcomeChannel = database.id;
        welcomeSettings.welcomeEmbed = false;
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(data, "welcomeEnableEmbed") ||
      Object.prototype.hasOwnProperty.call(data, "welcomeUpdateEmbed")
    ) {
      let checkDM = req.body["dmUser"];
      if (checkDM) {
        welcomeSettings.welcomeDM = true;
      } else {
        welcomeSettings.welcomeDM = false;
      }

      let checkIfEmbed = req.body["isEmbed"];

      let data = req.body;

      if (checkIfEmbed) {
        if (data.author_name) {
          if (data.author_name.length > 256) {
            renderTemplate(res, req, "./new/mainwelcome.ejs", {
              guild: guild,
              alert: `Please make sure the author length is below 200❌`,
              settings: storedSettings,
              welcome: welcomeSettings,
              leave: leaveSettings,
            });
            return;
          }

          welcomeSettings.embed.author.name = data.author_name;
        } else {
          welcomeSettings.embed.author.name = ``;
        }

        if (data.author_url) {
          if (
            rgx.test(data.author_url) ||
            data.author_url.toLowerCase() == "{useravatar}"
          ) {
            welcomeSettings.embed.author.url = data.author_url;
          } else {
            renderTemplate(res, req, "./new/mainwelcome.ejs", {
              guild: guild,
              alert: `Please make sure this is a valid URL❌`,
              settings: storedSettings,
              welcome: welcomeSettings,
              leave: leaveSettings,
            });
            return;
          }
        } else {
          welcomeSettings.embed.author.url = ``;
        }

        if (data.author_icon) {
          if (
            rgx.test(data.author_icon) ||
            data.author_icon.toLowerCase() == "{useravatar}"
          ) {
            welcomeSettings.embed.author.icon = data.author_icon;
          } else {
            renderTemplate(res, req, "./new/mainwelcome.ejs", {
              guild: guild,
              alert: `Please make sure this is a valid URL❌`,
              settings: storedSettings,
              welcome: welcomeSettings,
              leave: leaveSettings,
            });
            return;
          }
        } else {
          welcomeSettings.embed.author.icon = ``;
        }

        if (data.embedTitle) {
          if (data.embedTitle.length > 200) {
            renderTemplate(res, req, "./new/mainwelcome.ejs", {
              guild: guild,
              alert: `Please make sure your title is under 200 characters long❌`,
              settings: storedSettings,
              welcome: welcomeSettings,
              leave: leaveSettings,
            });
            return;
          }

          welcomeSettings.embed.title = data.embedTitle;
        } else {
          renderTemplate(res, req, "./new/mainwelcome.ejs", {
            guild: guild,
            alert: `Please make sure to include a title❌`,
            settings: storedSettings,
            welcome: welcomeSettings,
            leave: leaveSettings,
          });
          return;
        }

        if (data.embedTitleURL) {
          if (rgx.test(data.embedTitleURL)) {
            welcomeSettings.embed.titleURL = data.embedTitleURL;
          } else {
            renderTemplate(res, req, "./new/mainwelcome.ejs", {
              guild: guild,
              alert: `Invalid Link Provided ❌`,
              settings: storedSettings,
              welcome: welcomeSettings,
              leave: leaveSettings,
            });
            return;
          }
        } else {
          welcomeSettings.embed.titleURL = ``;
        }

        if (data.embedDescription) {
          if (data.embedDescription.length > 2000) {
            renderTemplate(res, req, "./new/mainwelcome.ejs", {
              guild: guild,
              alert: `Make sure the description is below 2000 characters long ❌`,
              settings: storedSettings,
              welcome: welcomeSettings,
              leave: leaveSettings,
            });

            return;
          }

          welcomeSettings.embed.description = data.embedDescription;
        } else {
          renderTemplate(res, req, "./new/mainwelcome.ejs", {
            guild: guild,
            alert: `Please provide a description ❌`,
            settings: storedSettings,
            welcome: welcomeSettings,
            leave: leaveSettings,
          });

          return;
        }

        if (data.embedThumbnail) {
          if (
            rgx.test(data.embedThumbnail) ||
            data.embedThumbnail.toLowerCase() == "{useravatar}"
          ) {
            welcomeSettings.embed.thumbnail = data.embedThumbnail;
          } else {
            renderTemplate(res, req, "./new/mainwelcome.ejs", {
              guild: guild,
              alert: `Please provide a valid thumbnail❌`,
              settings: storedSettings,
              welcome: welcomeSettings,
              leave: leaveSettings,
            });

            return;
          }
        } else {
          welcomeSettings.embed.thumbnail = ``;
        }

        if (data.embedImage) {
          if (
            rgx.test(data.embedImage) ||
            data.embedImage.toLowerCase() == "{useravatar}"
          ) {
            welcomeSettings.embed.image = data.embedImage;
          } else {
            renderTemplate(res, req, "./new/mainwelcome.ejs", {
              guild: guild,
              alert: `Please provide a valid image❌`,
              settings: storedSettings,
              welcome: welcomeSettings,
              leave: leaveSettings,
            });

            return;
          }
        } else {
          welcomeSettings.embed.image = ``;
        }

        if (data.embedFooter) {
          if (data.embedFooter.length > 1048) {
            renderTemplate(res, req, "./new/mainwelcome.ejs", {
              guild: guild,
              alert: `Make sure the footer is under 1000 characters long ❌`,
              settings: storedSettings,
              welcome: welcomeSettings,
              leave: leaveSettings,
            });

            return;
          }
          welcomeSettings.embed.footer = data.embedFooter;
        } else {
          welcomeSettings.embed.footer = "";
        }

        if (data.embedFooterIcon) {
          if (rgx.test(data.embedFooterIcon)) {
            welcomeSettings.embed.footerIcon = data.embedFooterIcon;
          } else {
            renderTemplate(res, req, "./new/mainwelcome.ejs", {
              guild: guild,
              alert: `Invalid Footer Icon ❌`,
              settings: storedSettings,
              welcome: welcomeSettings,
              leave: leaveSettings,
            });

            return;
          }
        } else {
          welcomeSettings.embed.footerIcon = "";
        }

        let timestamp = req.body["timestamp"];
        if (timestamp) {
          welcomeSettings.embed.timestamp = true;
        } else {
          welcomeSettings.embed.timestamp = false;
        }

        if (data.embedColor) {
          welcomeSettings.embed.color = data.embedColor;
        } else {
          welcomeSettings.embed.color = `#000000`;
        }

        welcomeSettings.welcomeEmbed = true;
      } else {
        welcomeSettings.welcomeEmbed = false;
      }

      welcomeSettings.welcomeToggle = true;
    }
    if (Object.prototype.hasOwnProperty.call(data, "welcomeDisable")) {
      welcomeSettings.welcomeToggle = false;
    }

    if (Object.prototype.hasOwnProperty.call(data, "leaveDisable")) {
      leaveSettings.leaveToggle = false;
    }

    await welcomeSettings.save().catch(() => {});
    await leaveSettings.save().catch(() => {});
    renderTemplate(res, req, "./new/mainwelcome.ejs", {
      guild: guild,
      alert: `Your Changes have been saved! ✅`,
      settings: storedSettings,
      welcome: welcomeSettings,
      leave: leaveSettings,
    });
  });

  app.get("/dashboard/:guildID/members", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD"))
      return res.redirect("/dashboard");

    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }

    renderTemplate(res, req, "./new/mainmembers.ejs", {
      guild: guild,
    });
  });

  app.get("/dashboard/:guildID/automod", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD"))
      return res.redirect("/dashboard");
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }
    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }

    renderTemplate(res, req, "./new/mainautomod.ejs", {
      guild: guild,
      alert: null,
      settings: storedSettings,
    });
  });

  app.post("/dashboard/:guildID/automod", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD"))
      return res.redirect("/dashboard");
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }
    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }

    renderTemplate(res, req, "./new/mainautomod.ejs", {
      guild: guild,
      alert: null,
      settings: storedSettings,
    });
  });

  app.get("/dashboard/:guildID/moderation", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD"))
      return res.redirect("/dashboard");
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }
    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }

    var logSettings = await Logging.findOne({ guildId: guild.id });
    if (!logSettings) {
      const newSettings1 = new Logging({
        guildId: guild.id,
      });
      await newSettings1.save().catch(() => {});
      logSettings = await Logging.findOne({ guildId: guild.id });
    }

    renderTemplate(res, req, "./new/mainmoderation.ejs", {
      guild: guild,
      alert: null,
      mod: logSettings.moderation,
      settings: storedSettings,
    });
  });

  app.post("/dashboard/:guildID/moderation", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD"))
      return res.redirect("/dashboard");
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }
    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }

    var logSettings = await Logging.findOne({ guildId: guild.id });
    if (!logSettings) {
      const newSettings1 = new Logging({
        guildId: guild.id,
      });
      await newSettings1.save().catch(() => {});
      logSettings = await Logging.findOne({ guildId: guild.id });
    }

    const data = req.body;
    const mod = logSettings.moderation;

    if (Object.prototype.hasOwnProperty.call(data, "save_main")) {
      const delete_after_executed = req.body["delete_after_executed"];
      if (delete_after_executed) {
        mod.delete_after_executed = "true";
      } else {
        mod.delete_after_executed = "false";
      }

      const delete_reply = req.body["delete_reply"];
      if (delete_reply) {
        mod.delete_reply = "true";
      } else {
        mod.delete_reply = "false";
      }

      const include_reason = req.body["include_reason"];
      if (include_reason) {
        mod.include_reason = "true";
      } else {
        mod.include_reason = "false";
      }

      const remove_roles = req.body["remove_roles"];
      if (remove_roles) {
        mod.remove_roles = "true";
      } else {
        mod.remove_roles = "false";
      }
      let autoroleValid = await guild.roles.cache.find(
        (r) => "@" + r.name === data.role
      );
      if (autoroleValid) {
        mod.mute_role = autoroleValid.id;
      } else {
        mod.mute_role = null;
      }

      const numbers = ["1", "2", "3", "4"];

      if (data.ban) {
        if (numbers.includes(data.ban)) {
          mod.ban_action = data.ban;
        } else {
          mod.ban_action = "1";
        }
      } else {
        mod.ban_action = "1";
      }

      if (data.kick) {
        if (numbers.includes(data.kick)) {
          mod.kick_action = data.kick;
        } else {
          mod.kick_action = "1";
        }
      } else {
        mod.kick_action = "1";
      }

      if (data.warn) {
        if (numbers.includes(data.warn)) {
          mod.warn_action = data.warn;
        } else {
          mod.warn_action = "1";
        }
      } else {
        mod.warn_action = "1";
      }

      if (data.mute) {
        if (numbers.includes(data.mute)) {
          mod.mute_action = data.mute;
        } else {
          mod.mute_action = "1";
        }
      } else {
        mod.mute_action = "1";
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(data, "auto_punish_save") ||
      Object.prototype.hasOwnProperty.call(data, "auto_punish_update")
    ) {
      const amount = data.amount;

      if (amount) {
        if (Number(amount) && Number(amount) < 51) {
          mod.auto_punish.amount = amount;
        } else {
          mod.auto_punish.amount = "1";
        }
      } else {
        mod.auto_punish.amount = "1";
      }

      const punishments = ["1", "2", "3"];
      if (data.punishment) {
        if (punishments.includes(data.punishment)) {
          mod.auto_punish.punishment = data.punishment;
        } else {
          mod.auto_punish.punishment = "1";
        }
      } else {
        mod.auto_punish.punishment = "1";
      }
      const numberss = ["1", "2", "3"];
      if (data.dm) {
        if (numberss.includes(data.dm)) {
          mod.auto_punish.dm = data.dm;
        } else {
          mod.auto_punish.dm = "1";
        }
      } else {
        mod.auto_punish.dm = "1";
      }
      mod.auto_punish.toggle = "true";
    }

    if (Object.prototype.hasOwnProperty.call(data, "auto_punish_disable")) {
      mod.auto_punish.toggle = "false";
      await logSettings.save().catch(() => {});

      renderTemplate(res, req, "./new/mainmoderation.ejs", {
        guild: guild,
        alert: `Auto Punish has been disabled ✅`,
        settings: storedSettings,
        mod: mod,
      });

      return;
    }

    if (Object.prototype.hasOwnProperty.call(data, "dm_disable")) {
      mod.ban_message.toggle = "false";
      await logSettings.save().catch(() => {});

      renderTemplate(res, req, "./new/mainmoderation.ejs", {
        guild: guild,
        alert: `Ban Message has been disabled ✅`,
        settings: storedSettings,
        mod: mod,
      });

      return;
    }

    if (
      Object.prototype.hasOwnProperty.call(data, "dm_save") ||
      Object.prototype.hasOwnProperty.call(data, "dm_update")
    ) {
      const message = data.dm_message;
      if (message && message.length) {
        if (message.length > 1999) {
          renderTemplate(res, req, "./new/mainmoderation.ejs", {
            guild: guild,
            alert: `Please Provide a message under 2000 characters long`,
            settings: storedSettings,
            mod: mod,
          });
          return;
        }
      } else {
        renderTemplate(res, req, "./new/mainmoderation.ejs", {
          guild: guild,
          alert: `Please Provide a message`,
          settings: storedSettings,
          mod: mod,
        });
        return;
      }

      mod.ban_message.toggle = "true";
      mod.ban_message.message = data.dm_message;
    }
    await logSettings.save().catch(() => {});

    renderTemplate(res, req, "./new/mainmoderation.ejs", {
      guild: guild,
      alert: `Your changes have been saved ✅`,
      settings: storedSettings,
      mod: mod,
    });
  });

  app.get("/dashboard/:guildID/logging", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD"))
      return res.redirect("/dashboard");
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }
    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }

    var logSettings = await Logging.findOne({ guildId: guild.id });
    if (!logSettings) {
      const newSettings1 = new Logging({
        guildId: guild.id,
      });
      await newSettings1.save().catch(() => {});
      logSettings = await Logging.findOne({ guildId: guild.id });
    }

    renderTemplate(res, req, "./new/mainlogging.ejs", {
      guild: guild,
      alert: null,
      settings: storedSettings,
      log: logSettings,
    });
  });

  app.post("/dashboard/:guildID/logging", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD"))
      return res.redirect("/dashboard");
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }
    const data = req.body;

    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }

    var logSettings = await Logging.findOne({ guildId: guild.id });
    if (!logSettings) {
      const newSettings1 = new Logging({
        guildId: guild.id,
      });
      await newSettings1.save().catch(() => {});
      logSettings = await Logging.findOne({ guildId: guild.id });
    }

    if (Object.prototype.hasOwnProperty.call(data, "moderation")) {
      const ban = req.body["ban"];
      if (ban) {
        logSettings.moderation.ban = true;
      } else {
        logSettings.moderation.ban = false;
      }

      const kick = req.body["kick"];
      if (kick) {
        logSettings.moderation.kick = true;
      } else {
        logSettings.moderation.kick = false;
      }

      const role = req.body["role-a"];
      if (role) {
        logSettings.moderation.role = true;
      } else {
        logSettings.moderation.role = false;
      }

      const purge = req.body["purge"];
      if (purge) {
        logSettings.moderation.purge = true;
      } else {
        logSettings.moderation.purge = false;
      }

      const lock = req.body["lock"];
      if (lock) {
        logSettings.moderation.lock = true;
      } else {
        logSettings.moderation.lock = false;
      }

      const warns = req.body["warns"];
      if (warns) {
        logSettings.moderation.warns = true;
      } else {
        logSettings.moderation.warns = false;
      }

      const mute = req.body["mute"];
      if (mute) {
        logSettings.moderation.mute = true;
      } else {
        logSettings.moderation.mute = false;
      }

      const slowmode = req.body["slowmode"];
      if (slowmode) {
        logSettings.moderation.slowmode = true;
      } else {
        logSettings.moderation.slowmode = false;
      }

      const nicknames = req.body["nicknames"];
      if (nicknames) {
        logSettings.moderation.nicknames = true;
      } else {
        logSettings.moderation.nicknames = false;
      }

      let channelValid = await guild.channels.cache.find(
        (ch) => `#${ch.name}` === data.moderation_channel
      );

      if (channelValid) {
        logSettings.moderation.channel = guild.channels.cache.find(
          (ch) => `#${ch.name}` === data.moderation_channel
        ).id;
      } else {
        logSettings.moderation.channel = null;
      }

      let channelValid2 = await guild.channels.cache.find(
        (ch) => `#${ch.name}` === data.ignore_channel
      );

      if (channelValid2) {
        logSettings.moderation.ignore_channel = guild.channels.cache.find(
          (ch) => `#${ch.name}` === data.ignore_channel
        ).id;
      } else {
        logSettings.moderation.ignore_channel = null;
      }

      let roleValid = await guild.roles.cache.find(
        (r) => "@" + r.name === data.ignore_role
      );

      if (roleValid) {
        logSettings.moderation.ignore_role = guild.roles.cache.find(
          (r) => "@" + r.name === data.ignore_role
        ).id;
      } else {
        logSettings.moderation.ignore_role = null;
      }

      const color = data.color;
      if (color) {
        logSettings.moderation.color = data.color;
      } else {
        logSettings.moderation.color = `#000000`;
      }

      const toggle = req.body["toggle"];
      if (toggle) {
        logSettings.moderation.toggle = true;
      } else {
        logSettings.moderation.toggle = false;
      }

      await storedSettings.save().catch(() => {});
      await logSettings.save().catch(() => {});

      renderTemplate(res, req, "./new/mainlogging.ejs", {
        guild: guild,
        log: logSettings,
        alert: `Your changes have been saved ✅`,
        settings: storedSettings,
      });

      return;
    }

    if (Object.prototype.hasOwnProperty.call(data, "server_events")) {
      const channel_created = req.body["channel_created"];
      if (channel_created) {
        logSettings.server_events.channel_created = true;
      } else {
        logSettings.server_events.channel_created = false;
      }

      const channel_update = req.body["channel_update"];
      if (channel_update) {
        logSettings.server_events.channel_update = true;
      } else {
        logSettings.server_events.channel_update = false;
      }

      const channel_delete = req.body["channel_delete"];
      if (channel_delete) {
        logSettings.server_events.channel_delete = true;
      } else {
        logSettings.server_events.channel_delete = false;
      }

      const role_create = req.body["role_create"];
      if (role_create) {
        logSettings.server_events.role_create = true;
      } else {
        logSettings.server_events.role_create = false;
      }

      const role_update = req.body["role_update"];
      if (role_update) {
        logSettings.server_events.role_update = true;
      } else {
        logSettings.server_events.role_update = false;
      }

      const guild_update = req.body["guild_update"];
      if (guild_update) {
        logSettings.server_events.guild_update = true;
      } else {
        logSettings.server_events.guild_update = false;
      }

      const emoji_update = req.body["emoji_update"];
      if (emoji_update) {
        logSettings.server_events.emoji_update = true;
      } else {
        logSettings.server_events.emoji_update = false;
      }

      const member_join = req.body["member_join"];
      if (member_join) {
        logSettings.server_events.member_join = true;
      } else {
        logSettings.server_events.member_join = false;
      }

      const member_leave = req.body["member_leave"];
      if (member_leave) {
        logSettings.server_events.member_leave = true;
      } else {
        logSettings.server_events.member_leave = false;
      }

      const join = req.body["join"];
      if (join) {
        logSettings.server_events.voice.join = true;
      } else {
        logSettings.server_events.voice.join = false;
      }

      const move = req.body["move"];
      if (move) {
        logSettings.server_events.voice.move = true;
      } else {
        logSettings.server_events.voice.move = false;
      }

      const leave = req.body["leave"];
      if (leave) {
        logSettings.server_events.voice.leave = true;
      } else {
        logSettings.server_events.voice.leave = false;
      }

      const dashboard = req.body["dashboard"];
      if (dashboard) {
        logSettings.server_events.dashboard = true;
      } else {
        logSettings.server_events.dashboard = false;
      }

      let channelValid = await guild.channels.cache.find(
        (ch) => `#${ch.name}` === data.channel1
      );

      if (channelValid) {
        logSettings.server_events.channel = guild.channels.cache.find(
          (ch) => `#${ch.name}` === data.channel1
        ).id;
      } else {
        logSettings.server_events.channel = null;
      }

      const color = data.color1;
      if (color) {
        logSettings.server_events.color = data.color1;
      } else {
        logSettings.server_events.color = `#000000`;
      }

      const toggle = req.body["toggle1"];
      if (toggle) {
        logSettings.server_events.toggle = true;
      } else {
        logSettings.server_events.toggle = false;
      }

      await storedSettings.save().catch(() => {});
      await logSettings.save().catch(() => {});

      renderTemplate(res, req, "./new/mainlogging.ejs", {
        guild: guild,
        log: logSettings,
        alert: `Your changes have been saved ✅`,
        settings: storedSettings,
      });

      return;
    }

    if (Object.prototype.hasOwnProperty.call(data, "member_events")) {
      const member_role_update = req.body["member_role_update"];
      if (member_role_update) {
        logSettings.member_events.role_update = true;
      } else {
        logSettings.member_events.role_update = false;
      }

      const name_change = req.body["name_change"];
      if (name_change) {
        logSettings.member_events.name_change = true;
      } else {
        logSettings.member_events.name_change = false;
      }

      let channelValid = await guild.channels.cache.find(
        (ch) => `#${ch.name}` === data.channel_member_events
      );

      if (channelValid) {
        logSettings.member_events.channel = guild.channels.cache.find(
          (ch) => `#${ch.name}` === data.channel_member_events
        ).id;
      } else {
        logSettings.member_events.channel = null;
      }

      const color = data.member_events_color;
      if (color) {
        logSettings.member_events.color = data.member_events_color;
      } else {
        logSettings.member_events.color = `#000000`;
      }

      const toggle = req.body["member_events_toggle"];
      if (toggle) {
        logSettings.member_events.toggle = true;
      } else {
        logSettings.member_events.toggle = false;
      }

      await storedSettings.save().catch(() => {});
      await logSettings.save().catch(() => {});

      renderTemplate(res, req, "./new/mainlogging.ejs", {
        guild: guild,
        log: logSettings,
        alert: `Your changes have been saved ✅`,
        settings: storedSettings,
      });

      return;
    }

    if (Object.prototype.hasOwnProperty.call(data, "message_events")) {
      const avatar_change = req.body["ignore"];
      if (avatar_change) {
        logSettings.message_events.ignore = true;
      } else {
        logSettings.message_events.ignore = false;
      }

      const deleted = req.body["deleted"];
      if (deleted) {
        logSettings.message_events.deleted = true;
      } else {
        logSettings.message_events.deleted = false;
      }

      const edited = req.body["edited"];
      if (edited) {
        logSettings.message_events.edited = true;
      } else {
        logSettings.message_events.edited = false;
      }

      const purged = req.body["purged"];
      if (purged) {
        logSettings.message_events.purged = true;
      } else {
        logSettings.message_events.purged = false;
      }

      let channelValid = await guild.channels.cache.find(
        (ch) => `#${ch.name}` === data.message_events_channel
      );

      if (channelValid) {
        logSettings.message_events.channel = guild.channels.cache.find(
          (ch) => `#${ch.name}` === data.message_events_channel
        ).id;
      } else {
        logSettings.message_events.channel = null;
      }

      const color = data.message_events_color;
      if (color) {
        logSettings.message_events.color = data.message_events_color;
      } else {
        logSettings.message_events.color = `#000000`;
      }

      const toggle = req.body["message_events_toggle"];
      if (toggle) {
        logSettings.message_events.toggle = true;
      } else {
        logSettings.message_events.toggle = false;
      }

      await storedSettings.save().catch(() => {});
      await logSettings.save().catch(() => {});

      renderTemplate(res, req, "./new/mainlogging.ejs", {
        guild: guild,
        log: logSettings,
        alert: `Your changes have been saved ✅`,
        settings: storedSettings,
      });

      return;
    }
  });

  app.get("/dashboard/:guildID/autorole", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");

    const member = await guild.members.fetch(req.user.id).catch(() => {
      res.redirect("/dashboard");
      return;
    });
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD"))
      return res.redirect("/dashboard");

    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }

    var stickySettings = await StickySettings.findOne({ guildId: guild.id });
    if (!stickySettings) {
      const newSettingss = new StickySettings({
        guildId: guild.id,
      });
      await newSettingss.save().catch(() => {});
      stickySettings = await StickySettings.findOne({ guildId: guild.id });
    }

    renderTemplate(res, req, "./new/mainautorole.ejs", {
      guild: guild,
      alert: null,
      settings: storedSettings,
      sticky: stickySettings,
    });
  });

  app.post("/dashboard/:guildID/autorole", checkAuth, async (req, res) => {
    let data = req.body;

    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD"))
      return res.redirect("/dashboard");
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }
    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }
    var stickySettings = await StickySettings.findOne({ guildId: guild.id });
    if (!stickySettings) {
      const newSettingss = new StickySettings({
        guildId: guild.id,
      });
      await newSettingss.save().catch(() => {});
      stickySettings = await StickySettings.findOne({ guildId: guild.id });
    }

    if (
      Object.prototype.hasOwnProperty.call(data, "autoroleEnable") ||
      Object.prototype.hasOwnProperty.call(data, "autoroleUpdate")
    ) {
      storedSettings.autoroleToggle = true;

      let autoroleValid = await guild.roles.cache.find(
        (r) => "@" + r.name === data.role
      );

      if (autoroleValid) {
        storedSettings.autoroleID = guild.roles.cache.find(
          (r) => "@" + r.name === data.role
        ).id;
      } else {
        storedSettings.autoroleToggle = false;
        storedSettings.autoroleID = null;
      }
    }

    if (Object.prototype.hasOwnProperty.call(data, "autoroleDisable")) {
      storedSettings.autoroleToggle = false;
      storedSettings.autoroleID = null;

      await storedSettings.save().catch(() => {});

      renderTemplate(res, req, "./new/mainautorole.ejs", {
        guild: guild,
        settings: storedSettings,
        sticky: stickySettings,
        alert: "Successfuly disabled the autorole Module ✅",
      });
      return;
    }

    if (
      Object.prototype.hasOwnProperty.call(data, "stickyroleEnable") ||
      Object.prototype.hasOwnProperty.call(data, "stickyUpdate")
    ) {
      stickySettings.stickyroleToggle = true;

      let autoroleValid = await guild.roles.cache.find(
        (r) => "@" + r.name === data.stickyrole
      );

      if (autoroleValid) {
        stickySettings.stickyroleID = guild.roles.cache.find(
          (r) => "@" + r.name === data.stickyrole
        ).id;
      } else {
        stickySettings.stickyroleToggle = false;
        stickySettings.stickyroleID = null;
      }
    }

    if (Object.prototype.hasOwnProperty.call(data, "stickyroleDisable")) {
      stickySettings.stickyroleToggle = false;
      stickySettings.stickyroleID = null;
      stickySettings.stickyroleUser = [];
      await storedSettings.save().catch(() => {});
      await stickySettings.save().catch(() => {});

      renderTemplate(res, req, "./new/mainautorole.ejs", {
        guild: guild,
        settings: storedSettings,
        sticky: stickySettings,
        alert: "Successfuly disabled the sticky role Module ✅",
      });
      return;
    }

    await stickySettings.save().catch(() => {});
    await storedSettings.save().catch(() => {});
    renderTemplate(res, req, "./new/mainautorole.ejs", {
      guild: guild,
      sticky: stickySettings,
      alert: `Your Changes have been saved ✅`,
      settings: storedSettings,
    });
  });

  app.get("/dashboard/:guildID/reactionroles", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD"))
      return res.redirect("/dashboard");
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }
    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }

    renderTemplate(res, req, "./new/mainreactionroles.ejs", {
      guild: guild,
      alert: null,
      emojiArray: EmojiArray,
      settings: storedSettings,
    });
  });

  app.post("/dashboard/:guildID/reactionroles", checkAuth, async (req, res) => {
    let data = req.body;

    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD"))
      return res.redirect("/dashboard");
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }
    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }

    if (Object.prototype.hasOwnProperty.call(data, "reset")) {
      const conditional = {
        guildid: guild.id,
      };
      const results = await ReactionRole.find(conditional);

      if (results && results.length) {
        for (const result of results) {
          try {
            await ReactionRole.deleteOne(conditional);
          } catch (e) {
            console.log(e);
          }
        }
      }

      let resultsHeheLol = results.length;
      let resultsHehe = `reaction roles`;
      if (resultsHeheLol == "1") resultsHehe = "reaction role";

      if (resultsHeheLol === "0" || !results || !results.length) {
        renderTemplate(res, req, "./new/mainreactionroles.ejs", {
          guild: guild,
          alert: `The current guild doesn't have any existing reaction Role to delete.`,
          emojiArray: EmojiArray,
          settings: storedSettings,
        });

        return;
      }

      renderTemplate(res, req, "./new/mainreactionroles.ejs", {
        guild: guild,
        alert: `Succesfuly wiped ${resultsHeheLol} ${resultsHehe} ✅`,
        emojiArray: EmojiArray,
        settings: storedSettings,
      });

      return;
    }

    if (Object.prototype.hasOwnProperty.call(data, "send")) {
      let channelValid = await guild.channels.cache.find(
        (ch) => `#${ch.name}` === data.sendChannel
      );

      let channel;
      if (channelValid) {
        channel = channelValid.id;
      } else {
        renderTemplate(res, req, "./new/mainreactionroles.ejs", {
          guild: guild,
          alert: `Please Provide me with a valid Channel`,
          emojiArray: EmojiArray,
          settings: storedSettings,
        });

        return;
      }

      let message;
      if (data.messageID) {
        try {
          const emojimessage = await channel.messages.fetch(data.messageID);
          message = emojimessage;
        } catch {
          renderTemplate(res, req, "./new/mainreactionroles.ejs", {
            guild: guild,
            alert: `Please Provide me with a valid message ID`,
            emojiArray: EmojiArray,
            settings: storedSettings,
          });
          return;
        }
      }

      const checkEmoji = data.emoji;

      let emoji;
      if (EmojiArray.includes(checkEmoji)) {
        emoji = checkEmoji;
      } else {
        renderTemplate(res, req, "./new/mainreactionroles.ejs", {
          guild: guild,
          alert: `Please Provide me with a valid Emoji`,
          emojiArray: EmojiArray,
          settings: storedSettings,
        });

        return;
      }

      let roleValid = await guild.roles.cache.find(
        (r) => "@" + r.name === data.role
      );
      let role;
      if (roleValid) {
        role = roleValid.id;
      } else {
        renderTemplate(res, req, "./new/mainreactionroles.ejs", {
          guild: guild,
          alert: `Please Provide me with a valid  Role`,
          emojiArray: EmojiArray,
          settings: storedSettings,
        });

        return;
      }

      const numbers = ["1", "2", "3", "4", "5", "6"];
      let rr;
      if (numbers.includes(data.rr)) {
        rr = Number(data.rr);
      } else {
        rr = 1;
      }

      message.react(emoji).catch(() => {});
      await reactP.reactionCreate(
        client,
        guild.id,
        message.id,
        role,
        emoji,
        "false",
        rr
      );

      renderTemplate(res, req, "./new/mainreactionroles.ejs", {
        guild: guild,
        alert: `Succesfully Created reaction role ✅`,
        emojiArray: EmojiArray,
        settings: storedSettings,
      });

      return;
    }

    if (Object.prototype.hasOwnProperty.call(data, "save")) {
      if (data.reactionrolescolor) {
        storedSettings.reactionColor = data.reactionrolescolor;
      } else {
        storedSettings.reactionColor = `#000000`;
      }

      if (data.reactionroleslog === `None`) {
        storedSettings.reactionLogs = null;
      } else {
        let suggestionValid = await guild.channels.cache.find(
          (ch) => `#${ch.name}` === data.reactionroleslog
        );

        if (suggestionValid) {
          storedSettings.reactionLogs = guild.channels.cache.find(
            (ch) => `#${ch.name}` === data.reactionroleslog
          ).id;
        } else {
          storedSettings.reactionLogs = null;
        }

        let checkrrDms = req.body["rrDM"];

        if (storedSettings.isPremium == "false") {
          storedSettings.reactionDM = true;
        } else {
          if (checkrrDms) {
            storedSettings.reactionDM = true;
          } else {
            storedSettings.reactionDM = false;
          }
        }
      }
    }
    await storedSettings.save().catch(() => {});
    renderTemplate(res, req, "./new/mainreactionroles.ejs", {
      guild: guild,
      alert: `Your Changes have been saved ✅`,
      emojiArray: EmojiArray,
      settings: storedSettings,
    });
  });

  app.get("/dashboard/:guildID/levels", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD"))
      return res.redirect("/dashboard");
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }
    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }

    renderTemplate(res, req, "./new/mainlevels.ejs", {
      guild: guild,
      alert: null,
      settings: storedSettings,
    });
  });

  app.post("/dashboard/:guildID/levels", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD"))
      return res.redirect("/dashboard");
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }
    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }

    renderTemplate(res, req, "./new/mainlevels.ejs", {
      guild: guild,
      alert: null,
      settings: storedSettings,
    });
  });

  app.get("/dashboard/:guildID/embeds", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD"))
      return res.redirect("/dashboard");
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }
    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }

    renderTemplate(res, req, "./new/mainembeds.ejs", {
      guild: guild,
      alert: null,
      settings: storedSettings,
    });
  });

  app.post("/dashboard/:guildID/embeds", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD"))
      return res.redirect("/dashboard");
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }
    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }
    const user = member;

    if (req.body.type === "embed") {
      let guild = client.guilds.cache.get(req.body.guild),
        channel = guild && guild.channels.cache.get(req.body.to),
        data = req.body.json;
      if (!guild || !channel || !data)
        return res.status(400).send("Some data is missing");
      const fetchmember = await guild.members.fetch(user.id);
      if (!fetchmember || !fetchmember.permissions.has("ADMINISTRATOR"))
        return res.status(403).send("You don't have permission.");
      if (
        !channel.permissionsFor(channel.guild.client.user).has("SEND_MESSAGES")
      )
        return res.status(403).send("I'm missing 'send message' permissions");
      if (cooldownEmbed.has(guild.id))
        return res.status(403).send("Slow Down!");
      try {
        await channel.send({
          content: data?.content,
          embeds: data?.embed ? [data?.embed] : [],
        });

        cooldownEmbed.add(guild.id);
        setTimeout(() => {
          cooldownEmbed.delete(guild.id);
        }, 5000);
        return;
      } catch (err) {
        res.status(403).send(`403 - ${err}`);
        return;
      }
    } else if (req.body.type === "customcommand") {
      let guild = client.guilds.cache.get(req.params.guildID),
        data = req.body.json,
        cmdname = req.body.command;

      if (!guild || !data) return;

      const name = cmdname.toLowerCase();
      if (!name) return;
      const check = cmdname.toLowerCase();
      if (!check) return;
      if (client.botCommands.get(check) || client.aliases.get(check)) return;
      const content = JSON.stringify(data);
      if (!content) return;
      if (storedSettings.isPremium === "false") {
        const conditional = {
          guildId: guild.id,
        };
        const results = await customCommand.find(conditional);

        if (results.length >= 10) return;
      }
      customCommand.findOne(
        {
          guildId: guild.id,
          name,
        },
        async (err, data) => {
          if (!data) {
            customCommand.create({
              guildId: guild.id,
              name,
              content,
              json: true,
            });
            return;
          }
        }
      );
    }
  });

  app.get("/contact", async (req, res) => {
    renderTemplate(res, req, "contact.ejs", { botName: config.botName });
  });

  app.get("/report", async (req, res) => {
    renderTemplate(res, req, "report.ejs", { botName: config.botName });
  });

  app.post("/report", async (req) => {
    if (req.body.type === "report") {
      const reportEmbed = new Discord.WebhookClient({
        url: jsonconfig.webhooks.report,
      });

      const report = new MessageEmbed()
        .setColor("GREEN")
        .setTitle(`${jsonconfig.botName} Reports`)
        .setDescription(
          `Someone just reported a user!\n\nUser: ${req.body.name}\`(${req.body.id})\`\nReported User: ${req.body.reported_user}\nReported User ID: ${req.body.reported_id}\nReason: \`${req.body.reason}\`\nProof: ${req.body.proof}`
        );

      reportEmbed.sendCustom({
        username: `${jsonconfig.botName} Reports`,
        avatarURL: `${domain}/logo.png`,
        embeds: [report],
      });
    }
  });

  app.post("/contact", async (req) => {
    if (req.body.type === "contact") {
      const contactEmbed = new Discord.WebhookClient({
        url: jsonconfig.webhooks.contact,
      });

      const contact = new MessageEmbed()
        .setColor("GREEN")
        .setTitle(`Contact Form`)
        .setDescription(
          `Someone just contacted us!\n\nUser: ${req.body.name}\`(${req.body.id})\`\nEmail: ${req.body.email}\nMessage: \`${req.body.msg}\``
        );

      contactEmbed.sendCustom({
        username: `${jsonconfig.botName} Contact`,
        avatarURL: `${domain}/logo.png`,
        embeds: [contact],
      });
    }
  });

  app.get("/dashboard/:guildID/tickets", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD"))
      return res.redirect("/dashboard");
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }

    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }

    var ticketSettings = await TicketSettings.findOne({ guildID: guild.id });
    if (!ticketSettings) {
      const newSettingsT = new TicketSettings({
        guildID: guild.id,
      });
      newSettingsT.ticketType = "reaction";
      await newSettingsT.save().catch(() => {});
      ticketSettings = await TicketSettings.findOne({ guildID: guild.id });
    }

    renderTemplate(res, req, "./new/maintickets.ejs", {
      guild: guild,
      alert: null,
      settings: storedSettings,
      ticket: ticketSettings,
    });
  });

  app.post("/dashboard/:guildID/tickets", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD"))
      return res.redirect("/dashboard");
    const data = req.body;
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }
    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }

    var ticketSettings = await TicketSettings.findOne({ guildID: guild.id });
    if (!ticketSettings) {
      const newSettingsz = new TicketSettings({
        guildID: guild.id,
      });
      newSettingsz.ticketType = "reaction";
      await newSettingsz.save().catch(() => {});

      ticketSettings = await TicketSettings.findOne({ guildID: guild.id });
    }

    if (Object.prototype.hasOwnProperty.call(data, "resetTicket")) {
      await ticketSettings.deleteOne().catch(() => {});

      const newSettings = new TicketSettings({
        guildID: guild.id,
      });
      newSettings.ticketType = "reaction";
      await newSettings.save().catch(() => {});

      const ticketSettingsNew = await TicketSettings.findOne({
        guildID: guild.id,
      });

      renderTemplate(res, req, "./new/maintickets.ejs", {
        guild: guild,
        settings: storedSettings,
        ticket: ticketSettingsNew,
        alert: "Successfuly Resetted Database ✅",
      });

      return;
    }

    if (
      Object.prototype.hasOwnProperty.call(data, "ticketEnable") ||
      Object.prototype.hasOwnProperty.call(data, "ticketUpdate")
    ) {
      ticketSettings.guildID = guild.id;
      ticketSettings.ticketToggle = true;

      if (data.ticketWelcomeMessage) {
        if (data.ticketWelcomeMessage.length > 1024) {
          ticketSettings.ticketWelcomeMessage = `Hey {user} Welcome to your ticket!

Thank you for creating a ticket, the support team will be with you shortly.
In the mean time, please explain your issue below`;
          renderTemplate(res, req, "./new/maintickets.ejs", {
            guild: guild,
            settings: storedSettings,
            ticket: ticketSettings,
            alert:
              "Make sure your description is less than 1024 characters long!",
          });

          return;
        }

        ticketSettings.ticketWelcomeMessage = data.ticketWelcomeMessage;
      } else {
        ticketSettings.ticketWelcomeMessage = `Hey {user} Welcome to your ticket!

Thank you for creating a ticket, the support team will be with you shortly.
In the mean time, please explain your issue below`;

        renderTemplate(res, req, "./new/maintickets.ejs", {
          guild: guild,
          settings: storedSettings,
          ticket: ticketSettings,
          alert: "Make sure to Include a ticket description!",
        });

        return;
      }

      if (data.ticketLogColor) {
        ticketSettings.ticketLogColor = data.ticketLogColor;
      } else {
        ticketSettings.ticketLogColor = `#000000`;
      }

      if (data.ticketWelcomeColor) {
        ticketSettings.ticketWelcomeColor = data.ticketWelcomeColor;
      } else {
        ticketSettings.ticketWelcomeColor = `#000000`;
      }

      let ticketCategoryValid = await guild.channels.cache.find(
        (ch) => `#${ch.name}` === data.ticketChannel
      );

      if (ticketCategoryValid) {
        ticketSettings.ticketModlogID = guild.channels.cache.find(
          (ch) => `#${ch.name}` === data.ticketChannel
        ).id;
      } else {
        ticketSettings.ticketToggle = false;
        ticketSettings.ticketModlogID = null;
      }

      let autoroleValid = await guild.roles.cache.find(
        (r) => "@" + r.name === data.ticketRole
      );

      if (autoroleValid) {
        ticketSettings.supportRoleID = guild.roles.cache.find(
          (r) => "@" + r.name === data.ticketRole
        ).id;
      } else {
        ticketSettings.ticketToggle = false;
        ticketSettings.supportRoleID = null;
      }

      let ticketLogValid = await guild.channels.cache.find(
        (ch) => ch.name === data.ticketCategory && ch.type === "GUILD_CATEGORY"
      );

      if (ticketLogValid) {
        ticketSettings.categoryID = guild.channels.cache.find(
          (ch) =>
            ch.name === data.ticketCategory && ch.type === "GUILD_CATEGORY"
        ).id;
      } else {
        ticketSettings.ticketToggle = false;
        ticketSettings.categoryID = null;
      }

      if (data.ticketLimit) {
        let numbers = [`1`, `2`, `3`, `4`, `5`];
        if (!numbers.includes(data.ticketLimit)) {
          renderTemplate(res, req, "./new/maintickets.ejs", {
            guild: guild,
            settings: storedSettings,
            ticket: ticketSettings,
            alert: "Invalid Number ❌",
          });

          return;
        }

        ticketSettings.maxTicket = data.ticketLimit;
      } else {
        ticketSettings.ticketToggle = false;
        ticketSettings.maxTicket = `1`;
      }

      let checkPing = req.body["pingEveryone"];

      if (checkPing) {
        ticketSettings.ticketPing = true;
      } else {
        ticketSettings.ticketPing = false;
      }

      let checkPingz = req.body["requireReason"];

      if (ticketSettings.ticketType == "message") {
        if (checkPingz) {
          ticketSettings.requireReason = true;
        } else {
          ticketSettings.requireReason = false;
        }
      }

      let checkPing2 = req.body["ticketClose"];

      if (storedSettings.isPremium == "false") {
        ticketSettings.ticketClose = true;
      } else {
        if (checkPing2) {
          ticketSettings.ticketClose = true;
        } else {
          ticketSettings.ticketClose = false;
        }
      }

      ticketSettings.ticketCustom == "false";
    }

    if (Object.prototype.hasOwnProperty.call(data, "ticketDisable")) {
      ticketSettings.ticketToggle = false;

      await ticketSettings.save().catch(() => {});
      await storedSettings.save().catch(() => {});

      renderTemplate(res, req, "./new/maintickets.ejs", {
        guild: guild,
        settings: storedSettings,
        ticket: ticketSettings,
        alert: "Successfuly disabled the ticket Module ✅",
      });
      return;
    }

    if (Object.prototype.hasOwnProperty.call(data, "sendEmbed")) {
      if (sendingEmbed.has(guild.id)) {
        renderTemplate(res, req, "./new/maintickets.ejs", {
          guild: guild,
          settings: storedSettings,
          ticket: ticketSettings,
          alert: "Slow Down! ❌",
        });
        return;
      }

      if (ticketSettings.ticketToggle == "true") {
        if (
          ticketSettings.ticketType == "reaction" &&
          ticketSettings.ticketCustom == "false"
        ) {
          let embedColor = data.reactionPanelColor;
          if (embedColor == "#000000") embedColor = guild.members.me.displayHexColor;
          let reactionTitle = data.reactionTitle;
          if (reactionTitle.length > 200) {
            renderTemplate(res, req, "./new/maintickets.ejs", {
              guild: guild,
              settings: storedSettings,
              ticket: ticketSettings,
              alert: "Make sure your title is not that long! ❌",
            });

            return;
          }

          let reactionDescription = data.reactionDescription;
          if (reactionDescription.length > 1024) {
            renderTemplate(res, req, "./new/maintickets.ejs", {
              guild: guild,
              settings: storedSettings,
              ticket: ticketSettings,
              alert: "Make sure your description is not that long! ❌",
            });

            return;
          }

          let ticketChannel = await guild.channels.cache.find(
            (ch) => `#${ch.name}` === data.ticketChannelReact
          );

          let ticketReaction = data.ticketReaction;

          if (storedSettings.isPremium == "false") ticketReaction = `🎫`;

          if (
            !embedColor ||
            !reactionTitle ||
            !reactionDescription ||
            !ticketChannel ||
            !ticketReaction
          ) {
            ticketSettings.ticketToggle = false;

            renderTemplate(res, req, "./new/maintickets.ejs", {
              guild: guild,
              settings: storedSettings,
              ticket: ticketSettings,
              alert: "Make sure your embed is correct ❌",
            });
            return;
          }

          ticketSettings.ticketTitle = reactionTitle;
          ticketSettings.ticketDescription = reactionDescription;
          ticketSettings.ticketEmbedColor = embedColor;
          ticketSettings.ticketReactChannel = ticketChannel.id;
          let checkTimestamp2 = req.body["ticketTimestamp"];
          if (checkTimestamp2) {
            ticketSettings.ticketTimestamp = true;
          } else {
            ticketSettings.ticketTimestamp = false;
          }

          if (storedSettings.isPremium == "false") {
            ticketSettings.ticketFooter = "Powered by neonova.eyum.org";
          } else {
            let checkFooter2 = req.body["reactionfooterEmbed"];
            if (checkFooter2) {
              if (data.reactionfooterEmbed.length > 140) {
                renderTemplate(res, req, "./new/maintickets.ejs", {
                  guild: guild,
                  settings: storedSettings,
                  ticket: ticketSettings,
                  alert: "Make sure your footer is not that long! ❌",
                });
                return;
              }

              ticketSettings.ticketFooter = data.reactionfooterEmbed;
            } else {
              ticketSettings.ticketFooter = null;
            }
          }

          let checkFooter = req.body["reactionfooterEmbed"];
          let reactionFooter = "Powered by neonova.eyum.org";

          let footer = "Powered by neonova.eyum.org";

          if (storedSettings.isPremium == "true") footer = reactionFooter;

          let ticketEmbed = new Discord.MessageEmbed()
            .setTitle(reactionTitle)
            .setColor(embedColor)
            .setDescription(reactionDescription);

          if (storedSettings.isPremium == "false") {
            ticketEmbed.setFooter({ text: `Powered by neonova.eyum.org` });
          } else {
            if (checkFooter) {
              ticketEmbed.setFooter({ text: data.reactionmbedFooter });
            }
          }

          let checkTimestamp = req.body["ticketTimestamp"];
          if (checkTimestamp) ticketEmbed.setTimestamp();

          ticketSettings.ticketType = "reaction";

          let emoji = data.ticketReaction;

          if (
            data.ticketReaction == "ticketReaction2" &&
            storedSettings.isPremium == "true"
          ) {
            emoji = "🎟️";
          } else if (
            data.ticketReaction == "✅" &&
            storedSettings.isPremium == "true"
          ) {
            emoji = "✅";
          } else if (
            data.ticketReaction == "📻" &&
            storedSettings.isPremium == "true"
          ) {
            emoji = "📻";
          } else if (
            data.ticketReaction == "☑️" &&
            storedSettings.isPremium == "true"
          ) {
            emoji = "☑️";
          } else if (
            data.ticketReaction == "📲" &&
            storedSettings.isPremium == "true"
          ) {
            emoji = "📲";
          } else if (
            data.ticketReaction == "📟" &&
            storedSettings.isPremium == "true"
          ) {
            emoji = "📟";
          } else if (
            data.ticketReaction == "🆕" &&
            storedSettings.isPremium == "true"
          ) {
            emoji = "🆕";
          } else if (
            data.ticketReaction == "📤" &&
            storedSettings.isPremium == "true"
          ) {
            emoji = "📤";
          } else if (
            data.ticketReaction == "📨" &&
            storedSettings.isPremium == "true"
          ) {
            emoji = "📨";
          } else if (
            data.ticketReaction == "🔑" &&
            storedSettings.isPremium == "true"
          ) {
            emoji = "🔑";
          } else if (
            data.ticketReaction == "🏷️" &&
            storedSettings.isPremium == "true"
          ) {
            emoji = "🏷️";
          } else {
            emoji = "🎫";
          }

          if (data.ticketReaction == "ticketReaction1") emoji = "🎫";
          if (data.ticketReaction == "📩") emoji = "📩";

          if (storedSettings.isPremium == "false") {
            if (data.ticketReaction == "🎫" || data.ticketReaction == "📩") {
              ticketSettings.ticketReaction = data.ticketReaction;
            } else {
              ticketSettings.ticketReaction = "🎫";
            }
          } else {
            ticketSettings.ticketReaction = emoji;
          }

          sendingEmbed.add(guild.id);
          setTimeout(() => {
            sendingEmbed.delete(guild.id);
          }, 10000);
          ticketChannel.send({ embeds: [ticketEmbed] }).then(async (s) => {
            s.react(emoji);

            ticketSettings.messageID.push(s.id);
            await ticketSettings.save().catch(() => {});
          });
        } else if (
          ticketSettings.ticketType == "reaction" &&
          ticketSettings.ticketCustom == "true"
        ) {
          let messageChannel = await guild.channels.cache.find(
            (ch) => `#${ch.name}` === data.ticketChannelReact
          );

          if (messageChannel) {
            ticketSettings.ticketReactChannel = guild.channels.cache.find(
              (ch) => `#${ch.name}` === data.ticketChannelReact
            ).id;
          } else {
            ticketSettings.ticketToggle = false;
            ticketSettings.ticketReactChannel = null;
          }

          await ticketSettings.save().catch(() => {});

          if (!data.messageID || data.messageID.length < 1) {
            renderTemplate(res, req, "./new/maintickets.ejs", {
              guild: guild,
              settings: storedSettings,
              ticket: ticketSettings,
              alert: "Could not find the following Message ",
            });
            return;
          }

          try {
            await messageChannel.messages.fetch(data.messageID);
          } catch {
            renderTemplate(res, req, "./new/maintickets.ejs", {
              guild: guild,
              settings: storedSettings,
              ticket: ticketSettings,
              alert: "Could not find the following Message ",
            });

            return;
          }

          let messageID = await messageChannel.messages.fetch(data.messageID);

          let emoji = data.ticketReaction;
          if (
            data.ticketReaction == "ticketReaction2" &&
            storedSettings.isPremium == "true"
          ) {
            emoji = "🎟️";
          } else if (
            data.ticketReaction == "✅" &&
            storedSettings.isPremium == "true"
          ) {
            emoji = "✅";
          } else if (
            data.ticketReaction == "📻" &&
            storedSettings.isPremium == "true"
          ) {
            emoji = "📻";
          } else if (
            data.ticketReaction == "☑️" &&
            storedSettings.isPremium == "true"
          ) {
            emoji = "☑️";
          } else if (
            data.ticketReaction == "📲" &&
            storedSettings.isPremium == "true"
          ) {
            emoji = "📲";
          } else if (
            data.ticketReaction == "📟" &&
            storedSettings.isPremium == "true"
          ) {
            emoji = "📟";
          } else if (
            data.ticketReaction == "🆕" &&
            storedSettings.isPremium == "true"
          ) {
            emoji = "🆕";
          } else if (
            data.ticketReaction == "📤" &&
            storedSettings.isPremium == "true"
          ) {
            emoji = "📤";
          } else if (
            data.ticketReaction == "📨" &&
            storedSettings.isPremium == "true"
          ) {
            emoji = "📨";
          } else if (
            data.ticketReaction == "🔑" &&
            storedSettings.isPremium == "true"
          ) {
            emoji = "🔑";
          } else if (
            data.ticketReaction == "🏷️" &&
            storedSettings.isPremium == "true"
          ) {
            emoji = "🏷️";
          } else {
            emoji = "🎫";
          }

          if (data.ticketReaction == "ticketReaction1") emoji = "🎫";
          if (data.ticketReaction == "📩") emoji = "📩";

          if (storedSettings.isPremium == "false") {
            if (data.ticketReaction == "🎫" || data.ticketReaction == "📩") {
              ticketSettings.ticketReaction = data.ticketReaction;
            } else {
              ticketSettings.ticketReaction = "🎫";
            }
          } else {
            ticketSettings.ticketReaction = emoji;
          }

          ticketSettings.guildID = guild.id;
          ticketSettings.messageID.push(messageID.id);

          await messageID.react(emoji).catch(() => {});
          sendingEmbed.add(guild.id);
          setTimeout(() => {
            sendingEmbed.delete(guild.id);
          }, 10000);

          await ticketSettings.save().catch(() => {});
          await storedSettings.save().catch(() => {});

          renderTemplate(res, req, "./new/maintickets.ejs", {
            settings: storedSettings,
            ticket: ticketSettings,
            guild: guild,
            alert: "Succesfuly reacted to the message! ✅",
          });
          return;
        }

        await ticketSettings.save().catch(() => {});
        await storedSettings.save().catch(() => {});

        renderTemplate(res, req, "./new/maintickets.ejs", {
          settings: storedSettings,
          ticket: ticketSettings,
          guild: guild,
          alert: "Succesfuly sent the Embed ✅",
        });
        return;
      }
    }

    if (Object.prototype.hasOwnProperty.call(data, "useMessage")) {
      ticketSettings.ticketCustom = true;
      ticketSettings.ticketType == "reaction";
      ticketSettings.guildID = guild.id;
      await ticketSettings.save().catch(() => {});
      await storedSettings.save().catch(() => {});
      renderTemplate(res, req, "./new/maintickets.ejs", {
        settings: storedSettings,
        ticket: ticketSettings,
        guild: guild,
        alert: "Succesfuly switched to Message Ticketing ✅",
      });

      return;
    }

    if (Object.prototype.hasOwnProperty.call(data, "useReaction")) {
      ticketSettings.ticketCustom = false;
      ticketSettings.guildID = guild.id;
      ticketSettings.ticketType == "reaction";
      await ticketSettings.save().catch(() => {});
      await storedSettings.save().catch(() => {});
      renderTemplate(res, req, "./new/maintickets.ejs", {
        settings: storedSettings,
        ticket: ticketSettings,
        guild: guild,
        alert: "Succesfuly switched to Reaction Ticketing ✅",
      });
      return;
    }

    if (Object.prototype.hasOwnProperty.call(data, "switchReaction")) {
      ticketSettings.ticketCustom = false;
      ticketSettings.ticketType = "reaction";

      await ticketSettings.save().catch(() => {});
      await storedSettings.save().catch(() => {});

      renderTemplate(res, req, "./new/maintickets.ejs", {
        settings: storedSettings,
        ticket: ticketSettings,
        guild: guild,
        alert: "Succesfuly switched to Reaction Ticketing ✅",
      });
      return;
    }

    if (Object.prototype.hasOwnProperty.call(data, "switchReaction2")) {
      ticketSettings.ticketCustom = false;
      ticketSettings.ticketType = "message";

      await ticketSettings.save().catch(() => {});
      await storedSettings.save().catch(() => {});

      renderTemplate(res, req, "./new/maintickets.ejs", {
        settings: storedSettings,
        ticket: ticketSettings,
        guild: guild,
        alert: "Succesfuly switched to message Ticketing ✅",
      });
      return;
    }

    await ticketSettings.save().catch(() => {});
    await storedSettings.save().catch(() => {});
    renderTemplate(res, req, "./new/maintickets.ejs", {
      guild: guild,
      alert: `Your changes have been saved ✅`,
      ticket: ticketSettings,
      settings: storedSettings,
    });
  });

  app.get("/dashboard/:guildID/suggestions", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD"))
      return res.redirect("/dashboard");
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }
    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }

    renderTemplate(res, req, "./new/mainsuggestions.ejs", {
      guild: guild,
      alert: null,
      settings: storedSettings,
    });
  });

  app.post("/dashboard/:guildID/suggestions", checkAuth, async (req, res) => {
    let data = req.body;
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD"))
      return res.redirect("/dashboard");
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }
    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }

    if (Object.prototype.hasOwnProperty.call(data, "saveChannel")) {
      let suggestionValid = await guild.channels.cache.find(
        (ch) => `#${ch.name}` === data.suggestionChannel
      );

      if (suggestionValid) {
        storedSettings.suggestion.suggestionChannelID =
          guild.channels.cache.find(
            (ch) => `#${ch.name}` === data.suggestionChannel
          ).id;
      } else {
        storedSettings.suggestion.suggestionChannelID = null;
      }
    }

    if (Object.prototype.hasOwnProperty.call(data, "additional")) {
      let suggestionValid = await guild.channels.cache.find(
        (ch) => `#${ch.name}` === data.logChannel
      );

      if (suggestionValid) {
        storedSettings.suggestion.suggestionlogChannelID =
          guild.channels.cache.find(
            (ch) => `#${ch.name}` === data.logChannel
          ).id;
      } else {
        storedSettings.suggestion.suggestionlogChannelID = null;
      }

      let checkDecline = req.body["decline"];

      if (checkDecline) {
        storedSettings.suggestion.decline = true;
      } else {
        storedSettings.suggestion.decline = false;
      }

      let checkDecline2 = req.body["deleteSuggestion"];

      if (checkDecline2) {
        storedSettings.suggestion.deleteSuggestion = true;
      } else {
        storedSettings.suggestion.deleteSuggestion = false;
      }
    }

    if (Object.prototype.hasOwnProperty.call(data, "premium")) {
      if (storedSettings.isPremium == "true") {
        if (data.color) {
          storedSettings.suggestion.suggestioncolor = data.color;
        } else {
          storedSettings.suggestion.suggestioncolor = `#000000`;
        }

        if (data.description) {
          if (data.description.length > 1024) {
            renderTemplate(res, req, "./new/mainsuggestions.ejs", {
              guild: guild,
              alert: `Make sure the description is less than 1024 characters long ❌`,
              settings: storedSettings,
            });
            return;
          }
          storedSettings.suggestion.description = data.description;
        } else {
          storedSettings.suggestion.description = `{suggestion}`;
        }

        if (data.footer) {
          if (data.footer.length > 1024) {
            renderTemplate(res, req, "./new/mainsuggestions.ejs", {
              guild: guild,
              alert: `Make sure the footer is less than 1024 characters long ❌`,
              settings: storedSettings,
            });
            return;
          }
          storedSettings.suggestion.footer = data.footer;
        } else {
          storedSettings.suggestion.footer = `{suggestion}`;
        }

        let time = req.body["timestamp"];
        if (time) {
          storedSettings.suggestion.timestamp = true;
        } else {
          storedSettings.suggestion.timestamp = false;
        }

        if (data.flexRadioDefault) {
          if (
            data.flexRadioDefault == "1" ||
            data.flexRadioDefault == "2" ||
            data.flexRadioDefault == "3"
          ) {
            storedSettings.suggestion.reaction = data.flexRadioDefault;
          } else {
            storedSettings.suggestion.reaction = `1`;
          }
        } else {
          storedSettings.suggestion.reaction = `1`;
        }
      }
    }

    await storedSettings.save().catch(() => {});
    renderTemplate(res, req, "./new/mainsuggestions.ejs", {
      guild: guild,
      alert: `Your changes have been saved ✅`,
      settings: storedSettings,
    });
  });

  app.get("/dashboard/:guildID/altdetector", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD"))
      return res.redirect("/dashboard");
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }
    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }

    var altSettings = await AltSettings.findOne({ guildID: guild.id });
    if (!altSettings) {
      const newSettings = new AltSettings({
        guildID: guild.id,
      });
      await newSettings.save().catch(() => {});
      altSettings = await AltSettings.findOne({ guildID: guild.id });
    }

    renderTemplate(res, req, "./new/mainaltdetector.ejs", {
      guild: guild,
      alert: null,
      settings: storedSettings,
      alt: altSettings,
    });
  });

  app.post("/dashboard/:guildID/altdetector", checkAuth, async (req, res) => {
    const data = req.body;

    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD"))
      return res.redirect("/dashboard");
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }
    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }

    var altSettings = await AltSettings.findOne({ guildID: guild.id });
    if (!altSettings) {
      const newSettings = new AltSettings({
        guildID: guild.id,
      });
      await newSettings.save().catch(() => {});
      altSettings = await AltSettings.findOne({ guildID: guild.id });
    }

    if (Object.prototype.hasOwnProperty.call(data, "disable")) {
      altSettings.altToggle = false;
    }
    if (
      Object.prototype.hasOwnProperty.call(data, "enable") ||
      Object.prototype.hasOwnProperty.call(data, "update")
    ) {
      let altValid = await guild.channels.cache.find(
        (ch) => `#${ch.name}` === data.channel
      );

      if (altValid) {
        altSettings.altModlog = guild.channels.cache.find(
          (ch) => `#${ch.name}` === data.channel
        ).id;
      } else {
        altSettings.altModlog = null;
      }

      const age = data.age;

      let days = age;
      if (isNaN(age)) days = "7";
      if (Number(age) > 100) days = "7";

      altSettings.altDays = days;

      const action = data.action;

      if (action == "kick") {
        altSettings.altAction = "kick";
      } else if (action == "ban") {
        altSettings.altAction = "ban";
      } else {
        altSettings.altAction = "none";
      }

      const id = data.id;
      let arrID = id.split(",");
      let newArr = [];
      let con = newArr.concat(arrID);

      const arrFiltered = con.filter((el) => {
        return el != null && el != "";
      });

      con = arrFiltered;

      if (storedSettings.isPremium == "false") {
        if (con.length > 10) {
          renderTemplate(res, req, "./new/mainaltdetector.ejs", {
            guild: guild,
            alert: `ID length exceeds 10 `,
            settings: storedSettings,
            alt: altSettings,
          });
          return;
        }
      } else if (storedSettings.isPremium == "true") {
        if (con.length > 50) {
          renderTemplate(res, req, "./new/mainaltdetector.ejs", {
            guild: guild,
            alert: `ID length exceeds 50 `,
            settings: storedSettings,
            alt: altSettings,
          });

          return;
        }
      }

      if (id) {
        altSettings.allowedAlts = con;
      } else {
        altSettings.allowedAlts = [];
      }

      altSettings.altToggle = true;
    }

    await altSettings.save().catch(() => {});

    renderTemplate(res, req, "./new/mainaltdetector.ejs", {
      guild: guild,
      alert: `Your changes have been saved ✅`,
      settings: storedSettings,
      alt: altSettings,
    });
  });

  app.get("/dashboard/:guildID/reports", checkAuth, async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD"))
      return res.redirect("/dashboard");
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }
    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }

    renderTemplate(res, req, "./new/mainreports.ejs", {
      guild: guild,
      alert: null,
      settings: storedSettings,
    });
  });

  app.post("/dashboard/:guildID/reports", checkAuth, async (req, res) => {
    const data = req.body;

    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD"))
      return res.redirect("/dashboard");
    const maintenance = await Maintenance.findOne({
      maintenance: "maintenance",
    });

    if (maintenance && maintenance.toggle == "true") {
      return renderTemplate(res, req, "maintenance.ejs");
    }
    var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    if (!storedSettings) {
      const newSettings = new GuildSettings({
        guildId: guild.id,
      });
      await newSettings.save().catch(() => {});
      storedSettings = await GuildSettings.findOne({ guildId: guild.id });
    }

    if (Object.prototype.hasOwnProperty.call(data, "saveChannel")) {
      let suggestionValid = await guild.channels.cache.find(
        (ch) => `#${ch.name}` === data.reportChannel
      );

      if (suggestionValid) {
        storedSettings.report.reportChannelID = guild.channels.cache.find(
          (ch) => `#${ch.name}` === data.reportChannel
        ).id;
      } else {
        storedSettings.report.reportChannelID = null;
      }
    }

    if (Object.prototype.hasOwnProperty.call(data, "additional")) {
      if (data.reportColor) {
        storedSettings.report.reportcolor = data.reportColor;
      } else {
        storedSettings.report.reportcolor = `#000000`;
      }

      let checkDecline = req.body["disableUser"];

      if (checkDecline) {
        storedSettings.report.disableUser = true;
      } else {
        storedSettings.report.disableUser = false;
      }

      let checkDecline2 = req.body["disableIssue"];

      if (checkDecline2) {
        storedSettings.report.disableIssue = true;
      } else {
        storedSettings.report.disableIssue = false;
      }

      let checkDecline3 = req.body["upvote"];

      if (checkDecline3) {
        if (storedSettings.isPremium == "true") {
          storedSettings.report.upvote = true;

          if (data.flexRadioDefault) {
            if (
              data.flexRadioDefault == "1" ||
              data.flexRadioDefault == "2" ||
              data.flexRadioDefault == "3"
            ) {
              storedSettings.report.reaction = data.flexRadioDefault;
              storedSettings.report.upvote = true;
            } else {
              storedSettings.report.reaction = `1`;
            }
          } else {
            storedSettings.report.reaction = `1`;
          }
        } else {
          storedSettings.report.upvote = false;
        }
      } else {
        storedSettings.report.upvote = false;
      }
    }

    await storedSettings.save().catch(() => {});
    renderTemplate(res, req, "./new/mainreports.ejs", {
      guild: guild,
      alert: `Your changes have been saved  ✅`,
      settings: storedSettings,
    });
  });

  app.get("/dblwebhook", async (req, res) => {
    res.send(`Top.gg API is currently working!`);
  });

  app.post("/dblwebhook", webhook.middleware(), async (req) => {
    const apiUser = await fetch(
      `https://discord.com/api/v8/users/${req.vote.user}`,
      {
        headers: { Authorization: `Bot ${process.env.TOKEN}` },
      }
    ).then((res) => res.json());

    const msg = new Discord.MessageEmbed()
      .setAuthor({ name: "Voting System", value: `${domain}/logo.png` })
      .setColor("#7289DA")
      .setTitle(`${apiUser.username} Just Voted`)
      .setDescription(
        `Thank you **${apiUser.username}#${apiUser.discriminator}** (${apiUser.id}) for voting **Neonova**!`
      );
    Hook.sendCustom(msg);

    const userSettings = await User.findOne({ discordId: req.vote.user });
    if (!userSettings)
      return User.create({
        discordId: req.vote.user,
        votes: 1,
        lastVoted: Date.now(),
      });

    let voteUser = await client.users.fetch(apiUser.id);

    let voteNumber = userSettings.votes;
    if (!voteNumber) voteNumber = 0;
    if (voteUser) {
      voteUser.send({
        embeds: [
          new Discord.MessageEmbed()
            .setColor("#7289DA")
            .setTitle(`Thanks for Voting!`)
            .setDescription(
              `Thank you **${apiUser.username}#${apiUser.discriminator}** (${
                apiUser.id
              }) for voting **Neonova**! \n\nVote #${voteNumber + 1}`
            ),
        ],
      });
    }

    await userSettings.updateOne({
      votes: userSettings.votes + 1 || 1,
      lastVoted: Date.now(),
    });
  });

  app.get("*", (req, res) => {
    var fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl;

    if (
      fullUrl == domain ||
      fullUrl == `${domain}/style.css` ||
      fullUrl == `${domain}/style.css` ||
      fullUrl == `${domain}/favico.ico`
    ) {
      renderTemplate(res, req, "index.ejs");
    } else {
      renderTemplate(res, req, "404.ejs");
    }
  });

  app.listen(port, null, null, () =>
    logger.info(`Listening on port ${port}`, {
      label: "Dashboard",
    })
  );

  function collectMemoryStats() {
    var memUsage = process.memoryUsage();
    metrics.gauge("memory.rss", memUsage.rss);
    metrics.gauge("memory.heapTotal", memUsage.heapTotal);
    metrics.gauge("memory.heapUsed", memUsage.heapUsed);
    metrics.gauge("CPU USAGE", cpu.usage());
    metrics.gauge(
      "Ram Usage",
      (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)
    );
    metrics.gauge("guilds.size", client.guilds.cache.size);
    metrics.gauge(
      "users.size",
      client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)
    );
    metrics.gauge("ping", client.ws.ping);
  }

  if (process.env.DATADOG_API_KEY) {
    metrics.init({
      apiKey: process.env.DATADOG_API_KEY,
      host: process.env.DATADOG_API_HOST,
      prefix: process.env.DATADOG_API_PREFIX,
    });
    setInterval(collectMemoryStats, 60000);
  }
};
