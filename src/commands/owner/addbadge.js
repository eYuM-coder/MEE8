const Command = require("../../structures/Command");
const User = require("../../database/schemas/User");
const { MessageEmbed } = require("discord.js");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "addbadge",
      aliases: ["ab"],
      description: "Add a certain badge to a user.",
      category: "Owner",
    });
  }

  async run(message, args) {
    const client = message.client;

    if (!client.config.owner.includes(message.author.id)) {
      return message.channel.sendCustom({
        embeds: [
          new MessageEmbed()
            .setColor(client.color.red)
            .setDescription(
              `${client.emoji.fail} | You are not the owner of this bot.`
            ),
        ],
      });
    }

    let user =
      message.mentions.users.first() ||
      client.users.cache.get(args[0]) ||
      match(args.join(" ").toLowerCase(), message.guild) ||
      message.author;

    if (!user) return message.channel.sendCustom("Provide me with a user.");

    const badge = args[1];
    if (!badge) return message.channel.sendCustom("Provide me with a badge");

    let userFind = await User.findOne({
      discordId: user.id,
    });

    if (!userFind) {
      const newUser = new User({
        discordId: message.author.id,
      });

      newUser.save();
      userFind = await User.findOne({
        discordId: user.id,
      });
    }

    if (userFind.badges && userFind.badges.includes(badge))
      return message.channel.sendCustom(`They already has that badge.`);

    userFind.badges.push(badge);
    await userFind.save().catch(() => {});
    message.channel.sendCustom(`Added the ${badge} to the user! `);
  }
};

function match(msg, i) {
  if (!msg) return undefined;
  if (!i) return undefined;
  let user = i.members.cache.find(
    (m) =>
      m.user.username.toLowerCase().startsWith(msg) ||
      m.user.username.toLowerCase() === msg ||
      m.user.username.toLowerCase().includes(msg) ||
      m.displayName.toLowerCase().startsWith(msg) ||
      m.displayName.toLowerCase() === msg ||
      m.displayName.toLowerCase().includes(msg)
  );
  if (!user) return undefined;
  return user.user;
}
