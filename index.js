const express = require('express')
const app = express();
const port = process.env.PORT || 4000;
const dotenv = require("dotenv");
const cors = require("cors");
// const userRouter = require("./routes/userRoutes");
require('dotenv/config')
const makeid = require ('./makeid')
const { uploadFile, getFileStream, sanitizeFile, uploadFile2} = require('./s3')
const axios = require('axios')
var downloadImage = require('./downloadfile')
const dbConnection = require('./dbCall.js')


let dict = {}
// app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
// app.use(bodyParser.json({ limit: "50mb" }));

async function removeFile(dir){
  await fs.unlinkSync(dir)
  console.log(`successfully empty the uploaded picture at ${dir} `)
}


const { Client, Collection, Events, GatewayIntentBits, IntentsBitField, SlashCommandBuilder} = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const fs = require('node:fs');
const path = require('node:path');
const { data } = require('./commands/cnews');
const { error } = require('node:console');
const wait = require('node:timers/promises').setTimeout;

let PROD = 'http://localhost:4000'


const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    GatewayIntentBits.Guilds
  ],
});
client.commands = new Collection()

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);

	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
    
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}  

client.on('ready', async() => {
  console.log('The bot is online!');
  console.log("try to fetch past events ...")
  try{
    // client.users.fetch('734280804863180900', false).then((user) => {
    //   user.send('hello world');
    // // });
    client.channels.cache.forEach(channel => {
      console.log(`Channel ID: ${channel.id}`);
      dict[channel.id] = 0
      
      
     
      // If the channel is a text channel
      // if (channel.type === 'text') {
      //     channel.members.forEach(member => {
      //         console.log(`User ID: ${member.id}`);
      //     });
      // }
    });
    console.log(dict)
    let sql = `SELECT time FROM events`;
    await dbConnection.query(sql, async(error, res, _) => {
      if (error) {
        console.log("Error: ", error);

      } else {
        console.log("db success: ", JSON.stringify(res))
        res.forEach((chunk)=>{
          let d1 = new Date(chunk.time);
          let d2 = new Date();
          if(d2 > d1){
            console.log("find a passed event, call this")
            client.users.fetch(chunk.receiver, false).then((user) => {
              user.send(`Hey! Your friend ${chunk.sender} is going ${chunk.eventname} soon, wanna say something?`);
            });

          
    
            // client.users.send('id', 'content');

            

          }
        })
      }
      })	

  }
  catch(error){
    console.log(error)
  }

});

const configuration = new Configuration({
  apiKey: process.env.OPEN_AI,
});

const openai = new OpenAIApi(configuration);


client.on(Events.InteractionCreate, async (interaction)=>{
  if(!interaction.isChatInputCommand()) return
  let command = interaction.client.commands.get(interaction.commandName);

  if (!command){
    console.error(`No command matching ${interaction.commandName} was found.`);
    return
  }
  
  else{
    try{
      await interaction.deferReply();
      await command.execute(interaction)
    }
    catch(error){
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    }
  }



})
// Chatting commands

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  tempc = message.channelId
  console.log(message.channelId, message.author.id)
  dict[message.channelId] +=1 
  console.log(dict)
  
  if(dict[tempc] > 30){
    console.log("more than 30 messages detected")
  }

  // dict['0'] += 1
  console.log(dict)

  if(message.content === 'ping'){
    message.reply('pong');
  }
  if(message.content.startsWith('!')){
    let conversationLog = [
      { role: 'system', 
      content: 'You are an AI assistant' },
    ];
    try {
      await message.channel.sendTyping();
      let prevMessages = await message.channel.messages.fetch({ limit: 1 });
      prevMessages.reverse();
      
      prevMessages.forEach((msg) => {
        conversationLog.push({
          role: 'user',
          content: msg.content,
          name: message.author.username
            .replace(/\s+/g, '_')
            .replace(/[^\w\s]/gi, ''),
        });
      });
  
      const result = await openai
        .createChatCompletion({
          model: 'gpt-3.5-turbo',
          messages: conversationLog,
          // max_tokens: 256, // limit token usage
        })
        .catch((error) => {
          console.log(`OPENAI ERR: ${error}`);
        });
      console.log(conversationLog)
      message.reply(result.data.choices[0].message);
    } catch (error) {
      console.log(`ERR: ${error}`);
    }
  }

});

client.login(process.env.TOKEN);


