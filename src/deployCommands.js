const fs = require("node:fs");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { green } = require("colors");

console.clear();


const commands = [];
const commandFolders = fs.readdirSync("./src/slashCommands");

for(const folder of commandFolders) {
  const commandFiles = fs.readdirSync(`./src/slashCommands/${folder}`).filter((file) => file.endsWith(".js"));

  for(const file of commandFiles) {
    const command = require(`./slashCommands/${folder}/${file}`);
    commands.push(command.data.toJSON());
  }
}


const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);
    console.log(green("Started refreshing application (/) commands."));

rest.put(Routes.applicationCommands(process.env.MAIN_CLIENT_ID), { body: commands })
.then((c) => {
  console.log(green("Successfully registered application commands."));
  return Promise.resolve(commands);
});