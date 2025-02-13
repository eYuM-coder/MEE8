const Command = require("../../structures/Command");
const Guild = require("../../database/schemas/Guild");
const darkrandom = require("random");
const darkemail = require("random-email");
const darkpassword = require("generate-password");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            name: "hack",
            description: "Hack someone! (fake)",
            category: "Fun",
            usage: "<user>",
            examples: [ "hack @john" ],
            cooldown: 3,
        });
    }

    async run(message) {


        const guildDB = await Guild.findOne({
            guildId: message.guild.id
        });

        const language = require(`../../data/language/${guildDB.language}.json`)


        const impostorpassword = darkpassword.generate({
            length: 10,
            numbers: true,
        });

        const user = message.mentions.users.first();
        if(!user) {
            return message.channel.sendCustom(`${language.hack1}`);
        } else {
            if (user.bot) {
                return message.channel.sendCustom(`${language.hackbot}`);
            }
        }
        const member = message.mentions.members.last();
        const mostCommon = [`${language.hack2}`, `${language.hack3}`, `${language.hack3}`, `${language.hack4}`, `${language.hack5}`, `${language.hack6}`];
        const lastdm = [
            `${language.hack7}`,
            `${language.hack8}`,
            `${language.hack9}`,
            `${language.hack10}`,
        ];


        message.channel.send(`${language.hack11} "${member.user.username}" ${language.hack12}`)
        .then(async (msg) => {
          setTimeout(async function () {
            await msg.edit(`[▘] ${language.hack13}`).catch(() => {});
          }, 1500);
          setTimeout(async function () {
            await msg.edit(
              `[▝] Email: \`${darkemail({
                domain: "gmail.com",
              })}\`\nPassword: \`${impostorpassword}\``
            ).catch(() => {});
          }, 3000);
          setTimeout(async function () {
            await msg.edit(
              `[▖] Last DM: "${lastdm[Math.floor(Math.random() * lastdm.length)]}"`
            ).catch(() => {});
          }, 4500);
          setTimeout(async function () {
            await msg.edit(`[▘] ${language.hack14}`).catch(() => {});
          }, 6000);
          setTimeout(async function () {
            await msg.edit(
              `[▝] mostCommon = "${
                mostCommon[Math.floor(Math.random() * mostCommon.length)]
              }"`
            ).catch(() => {});
          }, 7500);
          setTimeout(async function () {
            await msg.edit(`[▗] Finding IP address...`).catch(() => {});
          }, 9000)
          setTimeout(async function () {
            await msg.edit(
              `[▖] IP address: \`127.0.0.1:${darkrandom.int(100, 9999)}\``
            ).catch(() => {});
          }, 10500);
          setTimeout(async function () {
            await msg.edit(`[▘] ${language.hack15}`).catch(() => {});
          }, 12000);
          setTimeout(async function () {
            await msg.edit(`[▝] ${language.hack16}`).catch(() => {});
          }, 13500);
          setTimeout(async function () {
            await msg.edit(`${language.hack17} ${member.user.username}`).catch(() => {});
          }, 15000);
          setTimeout(async function () {
            await message.channel.send(
              `${language.hack18}`
            ).catch(() => {});
          }, 16500);
                });

}}