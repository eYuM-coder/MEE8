const fs = require("node:fs");
const crypto = require("crypto");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { green, yellow } = require("colors");

console.clear();

const commands = [];
const commandFolders = fs.readdirSync("./src/slashCommands");

// Read all commands and store them
for (const folder of commandFolders) {
  const commandFiles = fs
    .readdirSync(`./src/slashCommands/${folder}`)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const command = require(`./slashCommands/${folder}/${file}`);
    commands.push(command.data.toJSON());
  }
}

// Generate a hash from command data
const commandHash = crypto
  .createHash("sha256")
  .update(JSON.stringify(commands))
  .digest("hex");
const cacheFile = "./commandCache.json";

// Check if cache exists and read the previous hash
let previousHash = null;
if (fs.existsSync(cacheFile)) {
  try {
    const cacheData = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
    previousHash = cacheData.hash;
  } catch (err) {
    console.error("Error reading cache:", err);
  }
}

// Only update commands if the hash has changed
if (previousHash === commandHash) {
  console.log(yellow("No changes detected. Skipping command registration."));
} else {
  const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);
  console.log(green("Started refreshing application (/) commands."));

  rest
    .put(Routes.applicationCommands(process.env.MAIN_CLIENT_ID), {
      body: commands,
    })
    .then(() => {
      console.log(green("Successfully registered application commands."));
      // Save the new hash
      fs.writeFileSync(
        cacheFile,
        JSON.stringify({ hash: commandHash }, null, 2)
      );
    })
    .catch(console.error);
}
