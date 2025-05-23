const { Client, Collection } = require("discord.js");
const Util = require("./src/structures/Util.js");
const config = require("./config.json");
const fs = require("node:fs");
const path = require("node:path");
const { status } = config;

module.exports = class NeonovaClient extends Client {
  constructor(options = {}) {
    super({
      partials: ["MESSAGE", "CHANNEL", "REACTION", "GUILD_MEMBER", "USER"],
      intents: [
        "GUILDS",
        "GUILD_MEMBERS",
        "GUILD_MESSAGES",
        "GUILD_EMOJIS_AND_STICKERS",
        "GUILD_MESSAGE_REACTIONS",
        "GUILD_VOICE_STATES",
        "GUILD_PRESENCES",
      ],
      allowedMentions: {
        parse: ["roles", "users", "everyone"],
        repliedUser: true,
      },
      presence: {
        status: "online",
        activities: [
          {
            type: "WATCHING",
            name: status,
          },
        ],
      },
    });
    this.validate(options);
    this.botCommands = new Collection();
    this.slashCommands = new Collection();
    this.botEvents = new Collection();
    this.aliases = new Collection();
    this.utils = require("./src/utils/utils.js");
    this.mongoose = require("./src/utils/mongoose.js");
    this.utils = new Util(this);
    this.config = require("./config.json");
  }

  validate(options) {
    if (typeof options !== "object")
      throw new TypeError("Options should be a type of Object.");

    if (!options.prefix)
      throw new Error("You must pass a prefix for the client.");
    if (typeof options.prefix !== "string")
      throw new TypeError("Prefix should be a type of String.");
    this.prefix = options.prefix;
  }

  async start(token) {
    require("./src/utils/prototypes.js");
    await this.utils.loadCommands();
    await this.utils.loadEvents();
    await this.mongoose.init();
    this.login(token);
  }
};
