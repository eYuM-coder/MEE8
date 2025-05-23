const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("slots")
    .setDescription("Play a simulation of a slots machine!")
    .addStringOption((option) =>
      option
        .setName("bet")
        .setDescription("The amount of money you want to bet")
    )
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1]),
  async execute(interaction) {
    try {
      const bet = interaction.options.getString("bet");

      // Check if the bet is a valid number
      if (isNaN(bet) || bet <= 0) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(interaction.client.color.red)
              .setDescription("Please enter a valid bet amount."),
          ],
        });
      }

      const profile = await Profile.findOne({
        userID: interaction.user.id,
      });

      // Check if the user has a profile, create one if not
      if (!profile) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(interaction.client.color.red)
              .setDescription(
                `You currently do not have a profile registered!\nUse the /register command to register your profile.`
              ),
          ],
        });
      }

      // Check if the user has enough money to place the bet
      if (profile.wallet < bet) {
        return interaction.reply({
          embeds: [
            new MessageEmbed()
              .setColor(interaction.client.color.red)
              .setDescription("You don't have enough money to place that bet."),
          ],
        });
      }

      // Your slots logic goes here
      // For example, you can randomly generate slots and determine the outcome

      // Update the user's profile based on the outcome
      const outcome = Math.random() > 0.35 ? "win" : "lose";
      const winnings = outcome === "win" ? bet * 2 : 0;

      await Profile.updateOne(
        { userID: interaction.user.id },
        {
          $inc: {
            wallet: outcome === "win" ? winnings : -bet,
          },
        }
      );

      // Send a message with the outcome
      interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(
              outcome === "win"
                ? interaction.client.color.green
                : interaction.client.color.red
            )
            .setTitle(`${interaction.user.username}'s Slots Game`)
            .setDescription(
              outcome === "win"
                ? `Congratulations! You won $${winnings}.`
                : `Better luck next time. You lost $${bet}.`
            ),
        ],
      });
    } catch (error) {
      console.error("Error occurred:", error);
      interaction.reply({
        embeds: [
          new MessageEmbed()
            .setColor(interaction.client.color.red)
            .setDescription("An error occurred while processing the command."),
        ],
      });
    }
  },
};
