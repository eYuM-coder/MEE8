/* eslint-disable no-async-promise-executor */
/* eslint-disable no-constant-condition */
module.exports = async function (channel, message, options) {
  const init = new Promise(async (resolve) => {
    // Helper function to send messages through a webhook
    async function sendHook(hook, message, options) {
      // Check if the message is an embed
      if (
        typeof message !== "string" &&
        ["RichEmbed", "MessageEmbed"].includes(message.constructor.name)
      ) {
        options.embeds = [message];
        message = null;
      }

      // Send Webhook with or without mentions
      const callback = await hook.send(message, {
        name: options.name,
        username: options.username,
        avatarURL: options.icon,
        embeds: options.embeds,
        allowedMentions:
          (options.mentions || true) !== false ? undefined : { parse: [] },
      });

      resolve(callback);
    }

    // Fallback to normal channel messages if webhook fails
    async function fallback(channel, message, timer) {
      channel = channel.channel || channel; // Ensure proper channel object
      const callback = await channel.send(message);

      if (timer)
        setTimeout(() => {
          callback.delete();
        }, timer);

      resolve(callback);
    }

    // Validate input
    if (!channel)
      return console.log("HOOK: Please read the NPM page for documentation.");
    channel = channel.channel || channel;

    if (!channel.send || !channel.fetchWebhooks)
      return console.log("HOOK: Invalid Channel.");
    if (!message) return console.log("HOOK: Invalid Message.");

    // Default options setup
    options = {
      delete: options?.delete || false,
      color: options?.color || null,
      name: options?.name || "Message",
      icon: options?.icon || undefined,
      username: options?.username || "Default Hook",
      embeds: options?.embeds || [],
    };
    if (isNaN(options.delete)) options.delete = false;

    // Fetch webhooks
    let sended = false;
    let webhooks = await channel.fetchWebhooks().catch(() => {
      sended = true;
      fallback(channel, message, options.delete);
    });
    if (sended) return;

    // Find or create webhook
    let hook = webhooks.find((w) => w.name === options.username);
    if (!hook) {
      try {
        hook = await channel.createWebhook(options.username, {
          avatar: options.icon || null,
        });
      } catch (e) {
        console.error("Failed to create webhook:", e);
        fallback(channel, message, options.delete);
        return;
      }
      return sendHook(hook, message, options);
    }

    // Send the message via webhook
    sendHook(hook, message, options);
  });
  return init;
};
