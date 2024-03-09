const { error } = require("console");
const { SlashCommandBuilder } = require("discord.js");
const { json } = require("express");
const https = require("https");
const wait = require("node:timers/promises").setTimeout;
const { Configuration, OpenAIApi } = require("openai");
const axios = require("axios");
const NewsAPI = require("newsapi");

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
    Could you summarize three categories of mutual interest, and based on that, filter out five pieces of news with their url based on the news list provided? 
    You are provided the conversation log and the news list. Please respond the 3 categories and simply a list of urls.`;
    try {
      let conversationLog = [
        {
          role: "user",
          content: sys_msg,
          // name: interaction.author.username
        },
      ];
      let prevMessages = await interaction.channel.messages.fetch({
        limit: 40,
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
      let flag = false;
      // let data = {};
      await axios
        .get(
          `https://newsapi.org/v2/top-headlines?country=us&apiKey=aa1e48b344f34199821ceda24d9bfdd4`
        )
        .then((res) => {
          // console.log(res);
          if (res.data.status != "ok") {
            console.log("fetch news unsuccessful");
            interaction.editReply("fetch news unsuccessful");
          } else {
            let data = res.data.articles;
            console.log(data);
            data.forEach((news) => {
              prevnews +=
                news.title + ",source:" + news.source.name + ",url:" + news.url;
            });
            conversationLog.push({
              role: "user",
              content:
                "This is the headline news of today, separated by comma:" +
                prevnews,
            });
            console.log(conversationLog);
          }
        })
        .catch((error) => {
          console.log(error);
        });

      // feed to GPT API
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
      console.log("enews ");
      await interaction.editReply(res);
    } catch (err) {
      console.log("enews error", err);
    }
  },
};
