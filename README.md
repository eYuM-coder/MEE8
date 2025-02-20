# the Discord Bot [DJS V13] 🤖
![Alt](https://repobeats.axiom.co/api/embed/82d16a2aa6e1e68fe51bd39d7609a46735d40732.svg "Repobeats analytics image")
<p align="center">
  <br>
  <a href="https://github.com/peterhanania"><img src="https://mee8.eyum.org/favicon.ico"></a>
  <br>
  MEE8, a fully customizable bot built with 147 commands, 11 categories, and a dashboard using discord.js v13 🚀
  <br>
</p>

<h3 align=center>Explore the possibilities with MEE8! 🌐</h3>

[README-hindi.md](/README-hi-HI.md)
[README-polish](/README-pl-PL.md)

<div align=center>

 <a href="https://github.com/mongodb/mongo">
    <img src="https://img.shields.io/badge/MongoDB-%234ea94b.svg?&style=for-the-badge&logo=mongodb&logoColor=white" alt="mongo">
  </a>
  
  <a href="https://github.com/discordjs">
    <img src="https://img.shields.io/badge/discord.js-v13.6.0-blue.svg?logo=npm" alt="discordjs">
  </a>

  <a href="https://github.com/eYuM-coder/MEE8/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-Apache%202-blue" alt="license">
  </a>

</div>

<p align="center">
  <a href="#about">About</a>
  •
  <a href="#features">Features</a>
  •
  <a href="#installation">Installation</a>
  •
  <a href="#setting-up">Setting Up</a>
  •
  <a href="#license">License</a>
  •
  <a href="#donate">Donate</a>
  •
  <a href="#credits">Credits</a>
</p>

## Community Updates 🌟
[+ More dashboard pages and commands by Hotsuop](https://github.com/hotsu0p/MEE8)

[+ Slash commands by eYuM](https://github.com/MEE8-Bot/MEE8/tree/eyum-contributions)
## Latest commit!
✨added commands lock and unlock
*https://394wkx-3000.csb.app/changelog*
## Docs 📚
https://394wkx-3000.csb.app/docs
*these are pretty old for now*
*will update later*
## About 🤔

is a discord bot that we made exactly 2 years ago, the code was broken, so we decided to fix the bugs and make it a multipurpose discord.js v13 bot! You can click [this](https://394wkx-3000.csb.app//invite) link to invite the official Bot! Also, you can join the official [MEE8's Support Server](https://394wkx-3000.csb.app//support) for assistance.

If you liked this repository, feel free to leave a star ⭐

## Features 🚀

**147** commands and **11** different categories! 🎉

- **alt detector:** Blocks alts from the guild
- **applications:** Manage applications from the website
- **config:** Configure server settings
- **utility:** Some utility commands
- **economy:** Started but not done
- **fun:** A ton of commands to keep your server active
- **images:** Image Commands
- **information:** Information Commands
- **moderation:** Mod commands to moderate your discord server
- **reaction roles:** Reaction roles
- **tickets:** Guild tickets for support

even has the following features on the website 🌐

- **Ticket Transcripts** + **Application Transcripts**
- **Contact & Report** page
- **Welcome messages** and **farewell messages** including embeds.
- Full customizable **Logging** and **moderation**
- Full customizable **Suggestions** and **Server Reports**
- A built-in **Premium system**
- A built-in maintenance mode
- A members Page
- Auto Mod, Leveling, and Commands ( not done )
- Built-in TOP.gg API

 <h1 align="center">
  <a href="https://github.com/peterhanania"><img src="https://i.imgur.com/On7mMNg.jpg["></a>
</h1>

**Webhooks: (for Developer)**
With You can even log everything using webhooks directly from the config file!

<h1 align="center">
  <a href="https://github.com/peterhanania"><img src="https://i.imgur.com/vbGuLdL.jpg"></a>
</h1>

## Installation 🛠️

First clone the repo:

`git clone https://github.com/MEE8-Bot/MEE8.git`

Then run `Npm i` or `Npm install`
## Setting Up ⚙️

Your `config.json` should follow

- "developers": ID of Developers who can use the owner commands [ARRAY],
- "status": Your bot Status [STRING],
- "discord": Your bot's Support Server [STRING],
- "dashboard": If you want to enable the website dashboard ["true" / "false"] (STRING),
- "server": Your support server id [STRING],
- "prefix": Your default bot prefix [STRING],

Webhooks
- "logs": Webhook URL for command logs.,
-  "maintenance_logs": Webhook URL for maintenance logs (if it gets triggered automatically),
-  "ratelimit_logs": Webhook URL for ratelimit logs,
- "blacklist": Webhook URL for blacklist logs,
-  "report": Webhook URL for report logs,
-  "contact": Webhook URL for contact logs,
-  "bugs": Webhook URL for bugs logs,
-  "premium": Webhook URL for premium logs,
-  "suggestions": Webhook URL for suggestions logs,,
-  "votes": Webhook URL for votes logs,
-  "errors": Webhook URL for errors logs,
-  "auth": Webhook URL for auth logs,
-  "joinsPublic": Webhook URL to announce server joins in the support server,
-  "joinsPrivate": Webhook URL to announce server joins in your private server,
-  "leavesPublic": Webhook URL to announce server leaves in the support server,
-  "leavesPrivate": Webhook URL to announce server leaves in the private server,
-  "maintenance": Automatically enable maintenance mode if it gets rate limited ["true" / "false"] (STRING),
-  "maintenance_threshold": The amount of ratelimit triggers needed to enable maintenance mode [STRING] recommended [3-10]. Example "3",
-  "invite_link": Your bot's invite link,

SEO
-  "enabled": if you want to enable SEO ["true" / "false"] (STRING),
-  "title": Your website's SEO title [STRING],
-  "description": Your website's SEO description [STRING],

##


Your `.env` should match

THE ONES NEEDED
- TOKEN=YOUR BOT TOKEN
- MONGO=YOUR MONGO DATABASE URL
- SESSION_SECRET=A RANDOM STRING FOR SESSION SECURITY (Ex. 6B4E8&G#%Z&##bqcyEL5)
- AUTH_DOMAIN=Your Auth Domain (Ex. https://394wkx-3000.csb.app/ or http://localhost:3000) no slash at the end.
- MAIN_CLIENT_ID=the client id of your main application
- AUTH_CLIENT_ID=the client id of your auth application
- AUTH_CLIENT_SECRET= the client secret of your auth application
- PORT= the port of your website | default=3000

OPTIONAL
- ANALYTICS=your google analytics code,
- GOOGLE_SITE_VERIFICATION=your google site verification code,
- DATADOG_API_KEY=your data dog api key,
- DATADOG_API_HOST= your data dog api host,
- DATADOG_API_PREFIX= your data dog api prefix,
- DBL_AUTH= your dbl authorization



**The callbacks in Discord's dev portal**
This will have 2 parts, callback for the main client ID, and the other for the auth client ID. I did this so that the main client doesn't get ratelimited. You can use the same Id for main_client_id and auth_client_id and put the 3 callbacks in the same application.

MAIN CLIENT ID
yourdomain/thanks example https://394wkx-3000.csb.app//thanks or http://localhost:3000/thanks
yourdomain/window example https://394wkx-3000.csb.app//window or http://localhost:3000/window

AUTH CLIENT ID
yourdomain/callback example https://394wkx-3000.csb.app//callback or http://localhost:3000/callback


**TOP.gg**
To add top.gg to your site, add `DBL_AUTH` as your dbl api key to the `.env` file. And `yourdomain/dblwebhook` as a webhook url on top.gg's site settings. Example:  `https://yourbot.com/dblwebhook

**Replit**
To run on replit you must install node js `v.16.9.1` to do so go to bash (the bash terminal on your repl) and paste: `npm init -y && npm i --save-dev node@16.9.0 && npm config set prefix=$(pwd)/node_modules/node && export PATH=$(pwd)/node_modules/node/bin:$PATH`

Pease make sure you have enabled `Privileged Intents` on your Discord [developer portal](https://discordapp.com/developers/applications/). You can find these intents under the "Bot" section, and there are two ticks you have to switch on. For more information on Gateway Intents, check out [this](https://discordjs.guide/popular-topics/intents.html#the-intents-bit-field-wrapper) link.

You can launch the bot with `npm start`

**Important Note:** Before you join the support server for help, read the guide carefully.

### Emojis 🎨

- You can change the emojis in: <br>
  1- `assets/emojis.json` <br>
  2- `data/emoji.js`

### Colors 🌈

- You can change the colors in `data/colors.js`

## License 📜
 Copyright Statement: Do not copy this website, if the code is found to be duplicated, reproduced,
    or copied we will fine you a minimum of $250,000 and criminal charges may be pressed.

    CopyOurCodeWeWillSendYouToJesus(C)2023ThisIsOurHardWork.
Released under the [MIT License]() license.

## Support 🤝
[Click here for the support server](https://mee8.eyum.org/support)

## Donate 💸

You can donate and make it stronger than ever [by clicking here](https://paypal.me/mee8bot)!

## Credits 🙌
[Old Credits](https://github.com/eYuM-coder/MEE8#credits)
- Peter Hanania [DJS Rewrite] - [github.com/peterhanania](https://github.com/peterhanania)
- JANO [DJS Rewrite] - [github.com/wlegit](https://github.com/wlegit)
- Hotsuop [Added commands & Commands] - [https://github.com/hotsu0p](https://github.com/hotsu0p)
