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
var callDB = require('./dbCall')
var downloadImage = require('./downloadfile')
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

client.on('ready', () => {
  console.log('The bot is online!');
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
  
  if (interaction.commandName === 'collect'){
    let prevMessages = await interaction.channel.messages.fetch({ limit: 1});
		prevMessages.reverse()
    // console.log(prevMessages)
    const sid = makeid(6)

    let server_url = 'https://cn-gallery.vercel.app/libraries'
    console.log(makeid(6))
    let img_url = ''
    prevMessages.forEach(async(msg) => {
     
      if(msg.attachments.size > 0){
        let content = ''
        if (msg.content.size > 0){
          content = msg.content
          console.log(content)
        }
        img_url = msg.attachments.first().url
        let aha = await downloadImage(img_url, `./uploads/${sid}.jpg`)
        console.log(img_url)
       
        // fs.exists( `./uploads/${sid}.jpg`, (exists) => {
        //   console.log(exists ? '存在' : '不存在');
        // });
        let s3_result = await uploadFile2(`./uploads/${sid}.jpg`, sid)
        console.log(s3_result.key)
        
        let sql = `INSERT INTO images(story_id, img_key) 
        VALUES('${sid}', '${s3_result.key}') RETURNING id`;

        let data = await callDB(sql)
        if (!data || data.length == 0) {
              res.status(404).send("unsuccess")
              console.log("insert image unsuccess")
        } else {
              console.log("successfully insert key")
            
        }
        await removeFile(`./uploads/${sid}.jpg`)

      }
      if(msg.content !== ''){
        console.log("2: ", msg.content)

        let content = msg.content
        
        let sql2 = `
        UPDATE images
        SET annotation='${content}'
        WHERE img_key='${sid}'
        RETURNING id;
        `
        let data = await callDB(sql2)
        if (!data || data.length == 0) {
              // res.status(404).send("unsuccess")
              console.log("update annotation unsuccess")
        } else {
              console.log(`successfully update annotation for image ${sid}`)
            
        }

        console.log(content)
        
        
      }
    })
		await interaction.reply(`Successfully submitted the image! Check it up at ${PROD}/user/image`);
	
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
  // if (message.channel.id !== process.env.CHANNEL_ID) return;
  // if (message.content.startsWith('!')) return;
  if(message.content === 'ping'){
    message.reply('pong');
  }
  if(message.content.startsWith('!')){
    let conversationLog = [
      { role: 'system', 
      content: 'You are an AI assistant' },
      // {
      //   role:'user',
      //   content: 'The example of a scene: Scene 1: {topic: Studying/Attending Classes, locations: [University Library, Classroom, Local Coffeeshop, Park], instruction: Take a short clip of studying or attending class}'
      // }
      
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


