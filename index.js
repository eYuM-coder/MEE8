global.ReadableStream = require("stream/web").ReadableStream;
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const NeonovaClient = require("./Neonova.js");
const Guild = require("./src/database/models/leveling.js");
const config = require("./config.json");
const { Collection } = require("discord.js");
const logger = require("./src/utils/logger");
const fs = require("node:fs");
const Neonova = new NeonovaClient(config);
const color = require("./src/data/colors");
const jointocreate = require("./src/structures/jointocreate");
const emoji = require("./src/data/emoji");
const warnModel = require("./src/database/models/moderation.js");
const sharder = require("./shards.js");
const deploy = require("./src/deployCommands.js");

let client = Neonova;
module.exports = client;

jointocreate(client);
Neonova.color = color;
Neonova.emoji = emoji;

require("dotenv").config();

client.on("ready", () => {
  async function checkEmptyWarnings() {
    try {
      const userWarnings = await warnModel.find({}, null, { maxTimeMS: 5000 });

      if (!userWarnings || userWarnings.length === 0) {
        return;
      }

      for (const userWarning of userWarnings) {
        const objectId = userWarning._id;

        // If no warnings remain, delete the warn model
        if (userWarning.warnings.length === 0) {
          await warnModel.findByIdAndDelete(objectId);
          logger.info(
            `Removed empty warn model for user ${userWarning.memberID} in guild ${userWarning.guildID}`,
            { label: "Database" }
          );
        }
      }
    } catch (error) {
      if (error.name === "MongoServerError" && error.code === 50) {
        logger.error(
          "Query timed out after 5000ms. Consider optimizing the database.",
          {
            label: "ERROR",
          }
        );
      } else {
        logger.error(`Error checking empty warnings: ${error.message}`, {
          label: "ERROR",
        });
      }
    }
  }

  setInterval(checkEmptyWarnings, 1000);
});


async function getGuildData(guildId) {
  let guild = await Guild.findOne({ guildId: guildId });

  if (!guild) {
    guild = new Guild({
      guildId: guildId,
      levelingEnabled: true,
      users: [],
    });
    await guild.save();
  }

  return guild;
}

async function getUserInGuild(userId, guildId, username) {
  let guild = await getGuildData(guildId);

  let user = guild.users.find((u) => u.userId === userId);

  if (!user) {
    user = {
      xp: 0,
      level: 1,
      messageTimeout: Date.now(),
      username,
      userId,
    };
    guild.users.push(user);
    await guild.save();
  }

  return { guild, user };
}

async function updateUserLevel(guildId, userId, xpGain) {
  const { guild, user } = await getUserInGuild(userId, guildId);

  user.xp += xpGain;
  let nextLevelXP = user.level * 50;
  let xpNeededForNextLevel = user.level * nextLevelXP;
  let previousLevel = user.level;
  let currentLevel = user.level;
  let currentXP = user.xp;

  user.messageTimeout = Date.now();

  while (user.xp >= xpNeededForNextLevel) {
    user.level += 1;
    nextLevelXP = user.level * 50;
    xpNeededForNextLevel = user.level * nextLevelXP;
    currentLevel = user.level;
  }

  await guild.save();

  return { xpNeededForNextLevel, previousLevel, currentLevel, currentXP };
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) {
    return;
  }

  const guildId = message.guild?.id;
  const userId = message.author.id;
  const username = message.author.username;

  const { user, guild } = await getUserInGuild(userId, guildId, username);

  if (Date.now() - user.messageTimeout >= 60000 && guild.levelingEnabled) {
    const xpGain = Math.floor(Math.random() * 15) + 10;
    const { previousLevel, xpNeededForNextLevel, currentLevel, currentXP } =
      await updateUserLevel(guildId, userId, xpGain);

    if (currentLevel > previousLevel) {
      const levelbed = new MessageEmbed()
        .setColor("#3498db")
        .setTitle("Level Up!")
        .setAuthor({
          name: message.author.username,
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        })
        .setDescription(`You have reached level ${currentLevel}`)
        .setFooter({ text: `XP: ${currentXP}/${xpNeededForNextLevel}` });

      message.channel.send({ embeds: [levelbed] });
    }
  }
});

function getRoleForLevel(level, guildId, userId, userData) {
  if (!userData.guilds[guildId]?.users[userId]) {
    return null;
  }

  const { levelUpRoles } = userData.guilds[guildId];

  if (!levelUpRoles) {
    return null;
  }

  const roleForLevel = levelUpRoles.find((role) => role.level === level);

  return roleForLevel?.roleId || getRoleIdForLevel(level, guildId, userData);
}

function getRoleIdForLevel(level, guildId, userData) {
  const guildRoles = userData.guilds[guildId]?.levelUpRoles || {};
  return guildRoles[level]?.roleId || null;
}

client.slashCommands = new Collection();
const commandsFolders = fs.readdirSync("./src/slashCommands");

for (const folder of commandsFolders) {
  const commandFiles = fs
    .readdirSync(`./src/slashCommands/${folder}`)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const slashCommand = require(`./src/slashCommands/${folder}/${file}`);
    client.slashCommands.set(slashCommand.data.name, slashCommand);
    Promise.resolve(slashCommand);
  }
}

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const slashCommand = client.slashCommands.get(interaction.commandName);

  if (!slashCommand) return;

  const subcommand = interaction.options.getSubcommand(false);

  try {
    try {
      await logger.info(
        `"${interaction}" (${slashCommand.data.name}${
          subcommand ? ` ${subcommand}` : ""
        }) ran by "${interaction.user.username}" (${
          interaction.user.id
        }) on guild "${interaction.guild.name}" (${
          interaction.guild.id
        }) in channel "${interaction.channel.name}" (${
          interaction.channel.id
        })`,
        { label: "Slash Commmand" }
      );
    } catch (error) {
      await logger.info(
        `"${interaction}" (${slashCommand.data.name}${
          subcommand ? ` ${subcommand}` : ""
        }) ran by "${interaction.user.username}" (${
          interaction.user.id
        }) in a DM.`,
        { label: "Slash Commmand" }
      );
    }
    await slashCommand.execute(interaction);
  } catch (error) {
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
    console.error(error);
  }
});

client.setMaxListeners(20);

const moreInfoEmbed = new MessageEmbed()
  .setColor("#0099ff")
  .setTitle("More Info")
  .setURL(`${process.env.AUTH_DOMAIN}/invite`)
  .setDescription(
    `${config.botName} is a discord bot with a lot of features. You can invite ${config.botName} to your server by clicking the button below.`
  )
  .setFooter({
    text: `${config.botName}`,
    iconURL: `${process.env.AUTH_DOMAIN}/assets/images/neonova.png`,
  })
  .addFields(
    {
      name: `Invite ${config.botName}`,
      value: `${process.env.AUTH_DOMAIN}/invite`,
      inline: false,
    },
    { name: "Support Server", value: "https://discord.gg/neonova", inline: false },
    {
      name: `Vote ${config.botName}`,
      value: "https://top.gg/bot/880243836830652958/vote",
      inline: false,
    }
  );
const levelupbutton = new MessageEmbed()
  .setColor(color.blue)
  .setTitle("Level Up")
  .setFooter({
    text: `${config.botName}`,
    iconURL: `${process.env.AUTH_DOMAIN}/assets/images/neonova.png`,
  })
  .setDescription(
    `Hmmm... This doesnt seem to do much, but you can click it anyways.`
  )
  .setURL(`${process.env.AUTH_DOMAIN}/invite`);

const invitebutton = new MessageActionRow().addComponents(
  new MessageButton()
    .setLabel(`Invite ${config.botName}`)
    .setStyle("LINK")
    .setURL(`${process.env.AUTH_DOMAIN}/invite`)
);

const infobutton = new MessageEmbed()
  .setTitle(`Info`)
  .setDescription(
    "Hello there pogger. If you want more info on this bot, you can check out the github repo or join the support server"
  )
  .setURL("https://github.com/eYuM-coder/Neonova/")
  .addFields({name:"Github Repo", value:"https://github.com/eYuM-coder/Neonova/"});

client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.isButton()) return;

    if (interaction.customId === "support") {
      await interaction.reply({
        embeds: [moreInfoEmbed],
        components: [invitebutton],
      });
    } else if (interaction.customId === "info") {
      await interaction.reply({ embeds: [infobutton] });
    } else if (interaction.customId === "levelup") {
      await interaction.reply({ embeds: [levelupbutton] });
    } else if (interaction.customId === "rerole") {
      const members = interaction.guild.members.cache;
      const newRandomUser = members.random();

      const newEmbed = new MessageEmbed()
        .setTitle("New Random User")
        .setDescription(`**User:** <@${newRandomUser.user.id}>`)
        .setColor("RANDOM")
        .setFooter({ text: `Requested by ${interaction.user.username}` });

      await interaction.update({ embeds: [newEmbed] });
    } else if (
      interaction.customId === "rock" ||
      interaction.customId === "paper" ||
      interaction.customId === "scissors"
    ) {
      const userChoice = interaction.customId;
      const botChoice = ["rock", "paper", "scissors"][
        Math.floor(Math.random() * 3)
      ];

      const emojis = {
        rock: "✊",
        paper: "✋",
        scissors: "✌️",
      };

      const resultEmbed = new MessageEmbed()
        .setColor("#00FF00")
        .setTitle("Rock Paper Scissors")
        .setDescription(
          `You chose ${emojis[userChoice]}, and the bot chose ${emojis[botChoice]}.`
        );

      let resultMessage;
      if (userChoice === botChoice) {
        resultMessage = "It's a tie!";
        resultEmbed.setColor("#FFFF00");
      } else {
        const userWins =
          (userChoice === "rock" && botChoice === "scissors") ||
          (userChoice === "paper" && botChoice === "rock") ||
          (userChoice === "scissors" && botChoice === "paper");
        resultMessage = userWins ? "You win!" : "You lose!";
        resultEmbed.addFields({name:
          "Result",
          value:`${resultMessage} ${emojis[userChoice]} beats ${emojis[botChoice]}`
      });
        if (userWins) {
          resultEmbed.setColor("#00FF00");
        } else {
          resultEmbed.setColor("#FF0000");
        }
      }

      const playAgainButton = new MessageButton()
        .setCustomId("playagain")
        .setLabel("Play Again")
        .setStyle("PRIMARY");

      const buttonRow = new MessageActionRow().addComponents(playAgainButton);

      await interaction.reply({
        embeds: [resultEmbed],
        components: [buttonRow],
      });
    } else if (interaction.customId === "playagain") {
      const gameEmbed = new MessageEmbed()
        .setColor("#0080FF")
        .setTitle("Rock Paper Scissors")
        .setDescription("Choose your move!");

      const rockButton = new MessageButton()
        .setCustomId("rock")
        .setLabel("Rock")
        .setEmoji("✊")
        .setStyle("SUCCESS");

      const paperButton = new MessageButton()
        .setCustomId("paper")
        .setLabel("Paper")
        .setEmoji("✋")
        .setStyle("SUCCESS");

      const scissorsButton = new MessageButton()
        .setCustomId("scissors")
        .setLabel("Scissors")
        .setEmoji("✌️")
        .setStyle("SUCCESS");

      const buttonRow = new MessageActionRow().addComponents(
        rockButton,
        paperButton,
        scissorsButton
      );

      await interaction.update({
        embeds: [gameEmbed],
        components: [buttonRow],
      });
    } else {
      return;
    }
  } catch (error) {
    console.error("Error handling button interaction:", error);
    await interaction.reply({ content: "An error occurred.", ephemeral: true });
  }
});

const { debounce } = require("lodash");

const blockEmojis = {
  I: "🟩",
  O: "🟨",
};

const tetrominos = [
  [[1, 1, 1, 1]],
  [
    [1, 1],
    [1, 1],
  ],
  [
    [1, 1, 1],
    [0, 1, 0],
  ],
  [
    [0, 1, 1],
    [1, 1],
  ],
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
  [[1, 1, 1, 1, 1]],
  [[1, 1, 1, 1, 1]],
];

function generateRandomTetromino() {
  return tetrominos[Math.floor(Math.random() * tetrominos.length)];
}

let gameState = {
  tetrominoRow: 0,
  tetrominoCol: 0,
  tetromino: generateRandomTetromino(),
  board: Array.from({ length: 20 }, () => Array(10).fill("⬛")),
};

let gameInterval;

client.on("messageCreate", async (message) => {
  if (message.content.toLowerCase() === "!starttetris") {
    await startTetrisGame(message);
  }
});
function renderBoard(board) {
  return board
    .map((row) => row.map((block) => blockEmojis[block] || block).join(" "))
    .join("\n");
}

async function startTetrisGame(message) {
  gameState.board = Array.from({ length: 20 }, () => Array(10).fill("⬛"));
  gameState.tetrominoCol = Math.floor(gameState.board[0].length / 2) - 2;
  const renderedBoard = renderBoard(gameState.board);
  const buttonMessage = await message.channel.send(
    `${renderedBoard}\n\nPress the buttons below to move the Tetromino!`
  );

  const buttons = [
    new MessageButton()
      .setCustomId("left")
      .setLabel("Move Left")
      .setStyle("PRIMARY"),
    new MessageButton()
      .setCustomId("right")
      .setLabel("Move Right")
      .setStyle("SECONDARY"),
    new MessageButton()
      .setCustomId("rotate")
      .setLabel("Rotate")
      .setStyle("DANGER"),
    new MessageButton()
      .setCustomId("harddrop")
      .setLabel("Hard Drop")
      .setStyle("SUCCESS"),
  ];

  const row = new MessageActionRow().addComponents(buttons);
  await buttonMessage.edit({ components: [row] });

  gameInterval = setInterval(async () => {
    await moveDown(gameState, buttonMessage);
  }, 1000);

  client.on("interactionCreate", async (interaction) => {
    try {
      if (!interaction.isButton()) return;

      const debouncedHandleInteraction = debounce(async () => {
        console.log(
          `Clicked ${interaction.customId} from ${interaction.user.username}`
        );
        if (interaction.user.id === message.author.id) {
          switch (interaction.customId) {
            case "left":
              await moveLeft(gameState, buttonMessage);
              await handleInteractionReply(interaction, "Moved left");
              break;
            case "right":
              await moveRight(gameState, buttonMessage);
              await handleInteractionReply(interaction, "Moved right");
              await message.reply(`Clicked ${interaction.customId}`);
              break;
            case "rotate":
              await rotateTetromino(gameState, buttonMessage);
              await handleInteractionReply(interaction, "Rotated");
              break;
            case "harddrop":
              await hardDrop(gameState, buttonMessage);
              await handleInteractionReply(interaction, "Hard dropped");
              break;
            default:
              break;
          }
        }
      }, 100);

      debouncedHandleInteraction();
    } catch (error) {
      console.error("Error handling interaction:", error);

      await interaction.reply(
        "An error occurred while processing your request."
      );
    }
  });

  async function handleInteractionReply(interaction, content) {
    try {
      const originalMessage = await interaction.fetchReply();

      if (!originalMessage) {
        console.log("Original message not found. Ignoring interaction.");
        return;
      }

      await interaction.reply({
        content,
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error replying to interaction:", error);
    }
  }

  function generateRandomTetromino() {
    return tetrominos[Math.floor(Math.random() * tetrominos.length)];
  }
  async function hardDrop(gameState, buttonMessage) {
    clearInterval(gameInterval);

    const lowestRow = getLowestPossibleRow(gameState);

    gameState.tetrominoRow = lowestRow;

    mergeTetrominoIntoBoard(gameState);
    sendNewTetromino(gameState);
    clearCompleteRows(gameState, buttonMessage);

    await updateBoard(gameState, buttonMessage);

    gameInterval = setInterval(async () => {
      await moveDown(gameState, buttonMessage);
    }, 1000);
  }

  function getLowestPossibleRow(gameState) {
    let lowestRow = gameState.tetrominoRow;

    for (let row = lowestRow + 1; row < gameState.board.length; row++) {
      if (canMove(gameState, "down", row)) {
        lowestRow = row;
      } else {
        break;
      }
    }

    return lowestRow;
  }
  async function moveDown(gameState, buttonMessage) {
    clearTetromino(gameState);

    if (canMove(gameState, "down")) {
      gameState.tetrominoRow += 1;
    } else {
      mergeTetrominoIntoBoard(gameState);
      sendNewTetromino(gameState);

      clearCompleteRows(gameState, buttonMessage);
    }

    placeTetromino(gameState);

    await updateBoard(gameState, buttonMessage);
  }

  function mergeTetrominoIntoBoard(gameState) {
    for (let row = 0; row < gameState.tetromino.length; row++) {
      for (let col = 0; col < gameState.tetromino[row].length; col++) {
        if (gameState.tetromino[row][col] !== 0) {
          gameState.board[gameState.tetrominoRow + row][
            gameState.tetrominoCol + col
          ] = "I";
        }
      }
    }
  }

  async function clearCompleteRows(gameState, buttonMessage) {
    let rowsCleared = 0;

    for (let row = gameState.board.length - 1; row >= 0; row--) {
      if (gameState.board[row].every((block) => block !== "⬛")) {
        gameState.board.splice(row, 1);
        rowsCleared++;
        gameState.board.unshift(Array(10).fill("⬛"));
      }
    }

    if (rowsCleared > 0) {
      await buttonMessage.edit(
        `${renderBoard(gameState.board)}\n\nRows cleared: ${rowsCleared}`
      );
    }
  }

  async function moveLeft(gameState, buttonMessage) {
    clearTetromino(gameState);

    if (canMove(gameState, "left")) {
      gameState.tetrominoCol -= 1;
    }

    placeTetromino(gameState);

    await updateBoard(gameState, buttonMessage);
  }

  async function moveRight(gameState, buttonMessage) {
    clearTetromino(gameState);

    if (canMove(gameState, "right")) {
      gameState.tetrominoCol += 1;
    }

    placeTetromino(gameState);

    await updateBoard(gameState, buttonMessage);
  }

  function multiplyMatrixVector(tetrominoMatrix, vector) {
    const result = [];
    for (let row = 0; row < tetrominoMatrix.length; row++) {
      let sum = 0;
      for (let col = 0; col < tetrominoMatrix[row].length; col++) {
        sum += tetrominoMatrix[row][col] * vector[col];
      }
      result.push(sum);
    }
    return result;
  }

  function rotateTetromino(tetromino, direction) {
    const rotationMatrix =
      direction === "clockwise"
        ? CLOCKWISE_ROTATION_MATRIX
        : COUNTERCLOCKWISE_ROTATION_MATRIX;
    const rotatedTetromino = [];

    for (let row = 0; row < tetromino.length; row++) {
      const newRow = [];
      for (let col = 0; col < tetromino[row].length; col++) {
        const newIndex = multiplyMatrixVector(rotationMatrix, [row, col]);
        newRow.push(tetromino[newIndex[0]][newIndex[1]]);
      }
      rotatedTetromino.push(newRow);
    }

    if (canPlaceTetromino(rotatedTetromino)) {
      return rotatedTetromino;
    } else {
      return null;
    }
  }

  const CLOCKWISE_ROTATION_MATRIX = [
    [0, 1],
    [-1, 0],
  ];

  const COUNTERCLOCKWISE_ROTATION_MATRIX = [
    [0, -1],
    [1, 0],
  ];

  function canMove(gameState, direction) {
    const newRow =
      gameState.tetrominoRow +
      (direction === "down" ? 1 : direction === "up" ? -1 : 0);
    const newCol =
      gameState.tetrominoCol +
      (direction === "left" ? -1 : direction === "right" ? 1 : 0);

    for (let row = 0; row < gameState.tetromino.length; row++) {
      for (let col = 0; col < gameState.tetromino[row].length; col++) {
        if (gameState.tetromino[row][col] !== 0) {
          const boardRow = newRow + row;
          const boardCol = newCol + col;

          if (
            boardRow < 0 ||
            boardRow >= gameState.board.length ||
            boardCol < 0 ||
            boardCol >= gameState.board[0].length ||
            gameState.board[boardRow][boardCol] !== "⬛"
          ) {
            return false;
          }
        }
      }
    }

    return true;
  }

  function sendNewTetromino(gameState) {
    const newTetromino = generateRandomTetromino();
    gameState.tetromino = newTetromino;
    gameState.tetrominoRow = 0;
    gameState.tetrominoCol = Math.floor(
      (gameState.board[0].length - newTetromino[0].length) / 2
    );
  }

  function canPlaceTetromino(gameState, tetromino) {
    for (let row = 0; row < tetromino.length; row++) {
      for (let col = 0; col < tetromino[row].length; col++) {
        if (
          tetromino[row][col] !== 0 &&
          (gameState.board[gameState.tetrominoRow + row] === undefined ||
            gameState.board[gameState.tetrominoRow + row][
              gameState.tetrominoCol + col
            ] !== "⬛")
        ) {
          return false;
        }
      }
    }
    return true;
  }

  function clearTetromino(gameState) {
    for (let row = 0; row < gameState.tetromino.length; row++) {
      for (let col = 0; col < gameState.tetromino[row].length; col++) {
        if (
          gameState.tetromino[row][col] !== 0 &&
          gameState.board[gameState.tetrominoRow + row] &&
          gameState.board[gameState.tetrominoRow + row][
            gameState.tetrominoCol + col
          ]
        ) {
          gameState.board[gameState.tetrominoRow + row][
            gameState.tetrominoCol + col
          ] = "⬛";
        }
      }
    }
  }

  function placeTetromino(gameState) {
    for (let row = 0; row < gameState.tetromino.length; row++) {
      for (let col = 0; col < gameState.tetromino[row].length; col++) {
        if (
          gameState.tetromino[row][col] !== 0 &&
          gameState.board[gameState.tetrominoRow + row] &&
          gameState.board[gameState.tetrominoRow + row][
            gameState.tetrominoCol + col
          ]
        ) {
          gameState.board[gameState.tetrominoRow + row][
            gameState.tetrominoCol + col
          ] = "I";
        }
      }
    }
  }

  async function updateBoard(gameState, buttonMessage) {
    await buttonMessage.edit(
      `${renderBoard(gameState.board)}\n\nButtons pressed:`
    );
  }
}

Neonova.react = new Map();
Neonova.fetchforguild = new Map();

Neonova.start(process.env.TOKEN);

process.on("unhandledRejection", (reason, p) => {
  logger.info(`[unhandledRejection] ${reason.message}`, { label: "ERROR" });
  console.log(reason, p);
});

process.on("uncaughtException", (err, origin) => {
  logger.info(`[uncaughtException] ${err.message}`, { label: "ERROR" });
  console.log(err, origin);
});

process.on("uncaughtExceptionMonitor", (err, origin) => {
  logger.info(`[uncaughtExceptionMonitor] ${err.message}`, { label: "ERROR" });
  console.log(err, origin);
});

process.on("multipleResolves", (type, promise, reason) => {
  logger.info(`[multipleResolves] MULTIPLE RESOLVES`, { label: "ERROR" });
  console.log(type, promise, reason);
});
