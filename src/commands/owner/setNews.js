const Command = require("../../structures/Command");
const NewsSchema = require("../../database/schemas/MEE8");

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: "setnews",
      description: "This is for the developers.",
      category: "Owner",
      usage: ["<text>"],
    });
  }

  async run(message, args) {
    if (message.client.config.developers.includes(message.author.id)) {
      return message.channel.sendCustom(`This command is for the owner.`);
    }
    let news = args.join(" ").split("").join("");
    if (!news) return message.channel.send("Please enter news.");
    const newsDB = await NewsSchema.findOne({});
    if (!newsDB) {
      await NewsSchema.create({
        news: news,
        time: new Date(),
      });

      return message.channel.send("News set.");
    }

    await NewsSchema.findOneAndUpdate(
      {},
      {
        news: news,
        time: new Date(),
      },
    );
  }
};
