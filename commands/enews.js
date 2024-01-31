const { error } = require("console");
const { SlashCommandBuilder } = require("discord.js");
const { json } = require("express");
const https = require("https");
const wait = require("node:timers/promises").setTimeout;
const { Configuration, OpenAIApi } = require("openai");
const axios = require("axios");

const news_categories = [
  "business",
  "entertainment",
  "general",
  "health",
  "science",
  "sports",
  "technology",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("enews")
    .setDescription("Get trending news that is of mutual interest!"),
  // interaction.deferReply()

  async execute(interaction) {
    const configuration = new Configuration({
      apiKey: process.env.OPEN_AI,
    });

    const openai = new OpenAIApi(configuration);
    let sys_msg = `You are an assisstant who helps people find topics of mutual interest. 
    Could you summarize three categories of mutual interest, and based on that, summarize three news topics with their url based on the news list provided? 
    You are provided the conversation log and the news list.`;
    try {
      let conversationLog = [
        {
          role: "user",
          content: sys_msg,
          // name: interaction.author.username
        },
      ];
      let prevMessages = await interaction.channel.messages.fetch({
        limit: 20,
      });
      conversationLog.push({
        role: "user",
        content: "Here is the conversation log between users: ",
      });
      prevMessages.reverse();

      prevMessages.forEach((msg) => {
        if (msg.author.username === "CN-bot") return;
        if (msg.content.startsWith("!")) return;
        if (msg.content.startsWith("/")) return;

        conversationLog.push({
          role: "user",
          content: msg.content,
        });
      });
      let prevnews = "";
      // let data = {};
      await axios
        .get(
          `https://newsapi.org/v2/top-headlines?apiKey=${process.env.NEWS_API}`
        )
        .then((res) => {
          console.log(res);
          if (res.data.status != "ok") {
            return;
          } else {
            async () => {
              let data = res.data.articles;
              data.forEach((news) => {
                prevnews += news.title + ", url: " + news.url;
              });
              conversationLog.push({
                role: "user",
                content:
                  "This is the headline news of today, separated by comma:" +
                  prevnews,
              });
              console.log(conversationLog);
              const result = await openai
                .createChatCompletion({
                  model: "gpt-4",
                  messages: conversationLog,
                })
                .catch((error) => {
                  console.log(`OPENAI ERR ${error}`);
                });
              console.log(result.data.choices[0].message);
              let res = result.data.choices[0].message;
              // let res2 = JSON.parse(res);
              // console.log(res.topics);
              await interaction.editReply(result.data.choices[0].message);
            };
          }
        })
        .catch((error) => {
          console.log(error);
        });
    } catch (err) {
      console.log(err);
    }
  },
};
