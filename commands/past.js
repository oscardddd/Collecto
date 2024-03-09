const { SlashCommandBuilder } = require("discord.js");
const https = require("https");
const { Configuration, OpenAIApi } = require("openai");
const wait = require("node:timers/promises").setTimeout;
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("past")
    .setDescription(
      "This command would generate three past experience that might be mutually relevant to friends."
    ),

  async execute(interaction) {
    const configuration = new Configuration({
      apiKey: process.env.OPEN_AI,
    });
    const openai = new OpenAIApi(configuration);
    let prevMessages = await interaction.channel.messages.fetch({ limit: 40 });
    prevMessages.reverse();
    let sys_msg =
      "You are an AI assistant. You would be given the conversation the users had. Can you identify the usernames of the people\
      involved in the conversation and come up with 3 past experiences that the users might have all had based on the the conversation? Your job is to interest people and make them engage in conversation topics you provided.";
    let conversationLog = [
      {
        role: "user",
        content: sys_msg,
        // name: interaction.author.username
      },
    ];

    prevMessages.forEach((msg) => {
      // if (msg.content.startsWith('!')) return;
      if (msg.author.bot) return;
      if (msg.author.username === "CN-bot") return;
      if (msg.content.startsWith("!")) return;
      if (msg.content.startsWith("/")) return;
      if (msg.content.startsWith("+")) return;

      conversationLog.push({
        role: "user",
        content: msg.author.username + ": " + msg.content,
        name: msg.author.username.replace(/\s+/g, "_").replace(/[^\w\s]/gi, ""),
      });
    });
    console.log(conversationLog);

    // await interaction.deferReply();

    const result = await openai
      .createChatCompletion({
        model: "gpt-4",
        messages: conversationLog,
        max_tokens: 300, // limit token usage
      })
      .catch((error) => {
        console.log(`OPENAI ERR: ${error}`);
      });
    // console.log(result)
    await wait(4000);
    console.log("past");
    await interaction.editReply(result.data.choices[0].message);
  },
};
