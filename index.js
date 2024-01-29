const express = require("express");
const app = express();
const port = process.env.PORT || 4000;
const dotenv = require("dotenv");
const cors = require("cors");
// const userRouter = require("./routes/userRoutes");
require("dotenv/config");
const makeid = require("./makeid");
const {
  uploadFile,
  getFileStream,
  sanitizeFile,
  uploadFile2,
} = require("./s3");
const axios = require("axios");
var downloadImage = require("./downloadfile");
const dbConnection = require("./dbCall.js");
// const events = require("./events.js");

let dict = {};

async function removeFile(dir) {
  await fs.unlinkSync(dir);
  console.log(`successfully empty the uploaded picture at ${dir} `);
}

const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  IntentsBitField,
  SlashCommandBuilder,
} = require("discord.js");
const { Configuration, OpenAIApi } = require("openai");
const fs = require("node:fs");
const path = require("node:path");
const { data } = require("./commands/cnews");
const { error } = require("node:console");
const wait = require("node:timers/promises").setTimeout;

let PROD = "http://localhost:4000";

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    GatewayIntentBits.Guilds,
  ],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

client.on("ready", async () => {
  console.log("The bot is online!");
  console.log("try to fetch past events ...");
  try {
    // client.users.fetch("734280804863180900", false).then((user) => {
    //   user.send("hello world");
    // });
    client.channels.cache.forEach((channel) => {
      console.log(`Channel ID: ${channel.id}`);
      dict[channel.id] = 0;

      // If the channel is a text channel
      // if (channel.type === 'text') {
      //     channel.members.forEach(member => {
      //         console.log(`User ID: ${member.id}`);
      //     });
      // }
    });
    setTimeout(async () => {
      console.log(dict);
      let sql = `SELECT * FROM events`;
      await dbConnection.query(sql, async (error, res, _) => {
        if (error) {
          console.log("Error: ", error);
        } else {
          console.log("db success: ", JSON.stringify(res));
          res.forEach((chunk) => {
            // console.log(chunk);
            let d1 = new Date(chunk.time);
            let d2 = new Date();
            if (d2 > d1) {
              try {
                if (chunk.receiver != "None" && chunk.receiver != "null") {
                  console.log("find a passed event, call this");

                  client.users.fetch(chunk.receiver, false).then((user) => {
                    user.send(
                      `Hey! Your friend ${chunk.sender} is going ${chunk.eventname} soon, wanna say something?`
                    );
                  });
                }
              } catch (error) {
                console.log("error: ", error);
              }
            }
          });
        }
      });
    }, 10000);
  } catch (error) {
    console.log(error);
  }
});

const configuration = new Configuration({
  apiKey: process.env.OPEN_AI,
});

const openai = new OpenAIApi(configuration);

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  let command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  } else {
    try {
      await interaction.deferReply();
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    }
  }
});
// Chatting commands

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  tempc = message.channelId;
  console.log(message.channelId, message.author.id);
  dict[message.channelId] += 1;
  console.log(dict);

  if (dict[tempc] >= 2) {
    const channel = client.channels.cache.get(tempc);
    const members = channel.members;
    members.forEach((member) => {
      console.log(member.id);
    });
    console.log("more than 20 messages detected");
    const configuration = new Configuration({
      apiKey: process.env.OPEN_AI,
    });
    const openai = new OpenAIApi(configuration);
    let prevMessages = await message.channel.messages.fetch({ limit: 5 });
    //let prevMessages = await interaction.channel.messages.fetch({ limit: 5 });
    prevMessages.reverse();
    let date_ob = new Date();
    // adjust 0 before single digit date
    let date = ("0" + date_ob.getDate()).slice(-2);
    // current month
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    // current year
    let year = date_ob.getFullYear();
    // current hours
    let hours = date_ob.getHours();
    // current minutes
    let minutes = date_ob.getMinutes();
    // current seconds
    let seconds = date_ob.getSeconds();

    let date_now =
      year +
      "-" +
      month +
      "-" +
      date +
      " " +
      hours +
      ":" +
      minutes +
      ":" +
      seconds;
    // prints date in YYYY-MM-DD HH:MM:SS format
    console.log(
      year +
        "-" +
        month +
        "-" +
        date +
        " " +
        hours +
        ":" +
        minutes +
        ":" +
        seconds
    );
    let sys_msg = `You are an AI assistant. Based on the previous conversations, can you help identify the important event mentiond during the conversation that comes with a specific time frame?\
      For example, If user with id 001 said to user of id 002 that he would have a birthday party next wednesday at 10 am, you should only return a list of JSON objects with no explanations [{"sender": "001", "receiver": "002" "time": 2023-12-19 10:00:00, "event": "Birthday party"}].\
      You should convert the time to SQL timestamp based on the timestamp right now: ${date_now}. You should use 00:00:00 as the time if no specific hour is mentioned. Return [ ] if the provided conversation does not have enough information.`;
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
        content: msg.author.id + ": " + msg.content,
        name: msg.author.username.replace(/\s+/g, "_").replace(/[^\w\s]/gi, ""),
      });
    });
    // console.log(conversationLog);

    // await interaction.deferReply();

    openai
      .createChatCompletion({
        model: "gpt-4",
        messages: conversationLog,
        max_tokens: 300, // limit token usage
      })
      .then(async (result) => {
        // await wait(4000);
        // console.log(result.data.choices[0].message.content)
        try {
          // console.log(result)
          let data1 = await result.data.choices[0].message.content;
          // console.log(data1);
          let data2 = await JSON.parse(data1);
          console.log(data2);
          let sender = "";
          let receiver = "";
          let timeStamp = "";
          let event = "";

          await data2.forEach((item) => {
            sender = item.sender;
            receiver = item.receiver;
            timeStamp = new Date(item.time)
              .toISOString()
              .slice(0, 19)
              .replace("T", " ");
            event = item.event;
            // let receiver = item.receiver
            // console.log("sender: ", sender);
            // console.log("receiver: ", receiver);
            // console.log("time: ", timeStamp);
          });

          // 0 is not expired, 1 is expired
          let sql = `INSERT INTO events (sender, receiver, time, eventname, expired) 
          VALUES ('${sender}', '${receiver}', '${timeStamp}', '${event}', '0')`;

          console.log("sql: ", sql);

          await dbConnection.query(sql, async (error, res, _) => {
            if (error) {
              console.log("Error: ", error);
              //   await interaction.editReply("db success")
            } else {
              console.log("db success: ", JSON.stringify(res));
              //   await interaction.editReply("db success")
            }
          });
        } catch (error) {
          console.log("error while inserting into database: ", error);
        }
      })
      .catch((error) => {
        console.log(`OPENAI ERR: ${error}`);
      });
    // console.log(result)
  }

  // dict['0'] += 1
  console.log(dict);

  if (message.content === "ping") {
    message.reply("pong");
  }
  if (message.content.startsWith("!")) {
    let conversationLog = [
      { role: "system", content: "You are an AI assistant" },
    ];
    try {
      await message.channel.sendTyping();
      let prevMessages = await message.channel.messages.fetch({ limit: 1 });
      prevMessages.reverse();

      prevMessages.forEach((msg) => {
        conversationLog.push({
          role: "user",
          content: msg.content,
          name: message.author.username
            .replace(/\s+/g, "_")
            .replace(/[^\w\s]/gi, ""),
        });
      });

      const result = await openai
        .createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: conversationLog,
          // max_tokens: 256, // limit token usage
        })
        .catch((error) => {
          console.log(`OPENAI ERR: ${error}`);
        });
      console.log(conversationLog);
      message.reply(result.data.choices[0].message);
    } catch (error) {
      console.log(`ERR: ${error}`);
    }
  }
});

client.login(process.env.TOKEN);
