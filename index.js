const express = require('express')
const app = express();
const port = process.env.PORT || 4000;
const dotenv = require("dotenv");
const cors = require("cors");
const userRouter = require("./routes/userRoutes");
require('dotenv/config')
const makeid = require ('./makeid')
const { uploadFile, getFileStream, sanitizeFile, uploadFile2} = require('./s3')

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
const wait = require('node:timers/promises').setTimeout;

let PROD = 'http://localhost:4000'

app.use(
  cors({
    origin: ["http://localhost:3000", "https://cn-gallery.vercel.app"],
    // origin: "https://cn-gallery.vercel.app",
  })
);

app.get("/", (req, res) => {
  res.send("Collective Narrative Server");
});


app.use("/user", userRouter);

app.get("/test", (req,res)=>{
  res.send("test123")
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


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
  apiKey: process.env.OPENAI_API_KEY,
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
// blast from the past
  else if (interaction.commandName === 'past'){
    let prevMessages = await interaction.channel.messages.fetch({ limit: 15 });
    prevMessages.reverse();
    // console.log(prevMessages)
    // let sys_msg = 'We are doing a past memory sharing activity, \
    // where people would share pictures with descriptions of their past experiences. you are an AI assistant who would be given a converation, and you should generate 5 possible sharing topics based on the conversation send to you. '
    // let sys_msg = 'Can you summarize the 5 main topics of the conversation happened in the discord channel? The conversation is as following:'
    // let sys_msg = 'We are doing a past memory sharing activity, \
    // where people share pictures with descriptions of their past experiences. As an AI assistant, you would be given a conversation and the user profiles of all users who involve in the conversation. Can you generate 3 sharing topics based on the common interest of the users out of their conversation and profiles?'
    
    // let sys_msg = 'Based on the conversation and the user profile, can you make a guess on what are the possibe interests of all users in the conversation?'
    let sys_msg = 'You are an AI assistant. You would first given some user information, and then the conversation the users had. Can you identify the usernames of the people involved in the conversation and come up with 3 topics that the users are mutually interested in based on the user information and the conversation?'
    let conversationLog = [
      { role: 'user', 
      content: sys_msg,
      // name: interaction.author.username
    
    } 
    ];
    conversationLog.push({
      role: 'user',
      content: 'User information of oscardd5: recently I am learning to cook!!! My career goal at this stage is Find an intern next summer lol',
      name: 'oscardd5'
    });

    conversationLog.push({
      role: 'user',
      content: 'User information of _234kia: Recently I am learning to do leetcode questions. My career goal at this stage is Find an intern next summer lol',
      name: 'oscardd5'
    });
    
    // prevMessages.forEach((msg) => {
    //   if (msg.attachments){
    //     console.log("url", msg.attachments)
    //   }
    // })


    prevMessages.forEach((msg) => {
      // if (msg.content.startsWith('!')) return;
      if (msg.author.id !== client.user.id && msg.author.bot) return;
      if (msg.author.username === 'CN-bot') return;
      if (msg.content.startsWith('!')) return;
      if (msg.content.startsWith('/')) return;
      if (msg.content.startsWith('+')) return;

      conversationLog.push({
          role: 'user',
          content: msg.author.username + ': '+ msg.content,
          name: msg.author.username
            .replace(/\s+/g, '_')
            .replace(/[^\w\s]/gi, ''),
      });
    
    });
    console.log(conversationLog)

    await interaction.deferReply();

    const result = await openai
        .createChatCompletion({
          model: 'gpt-3.5-turbo',
          messages: conversationLog,
          max_tokens: 300, // limit token usage
        })
        .catch((error) => {
          console.log(`OPENAI ERR: ${error}`);
        });
    // console.log(result)
    await wait(4000);
    await interaction.editReply(result.data.choices[0].message)

  }


  //get the gpt stuff work
  // if(interaction.commandName === 'prompt'){
    
  //   let prevMessages = await interaction.channel.messages.fetch({ limit: 15 });
  //   prevMessages.reverse();

  //   let sys_msg = ''
  //   let type = interaction.options.getString('type');
  //   if(type === '1'){
  //     // sys_msg = 'Can you summarize the input conversations and output a relevant video framework with four sections? The sections should be relevent to what the users are up to and successfully captures the daily routine they have based on the conversation. They would be able to contribute to it collaboratively \n' + 
  //     // 'For example, if the conversation revolves around a couple studying abroad in different countries, one section of your output should have a JSON-like format as the following: \n'+
  //     // 'title: A Day in Our Lives' +
  //     // 'Scene 1: {topic: Studying/Working from home, Locations: [University Library, Classroom, Local Coffeeshop, Park], Description: Share the moment of studying }';

  //     sys_msg = 'Can you summarize the input conversations and output a relevant video framework with four sections? The sections should be relevent to what the users are up to and successfully captures the daily routine they have based on the conversation. They would be able to contribute to it collaboratively \n' + 
  //     'The output should be of JSON format with four sections. The format of each section should have a JSON format with three fields as the following: {topic: , locations: , instructions: ,}'
  //   }
  //   else if(type === '2'){
  //     sys_msg = 'Can you summarize the input conversations and output a relevant fictional story script with four sections? The sections should be relevent to the conversations and the users should be interested in acting out the script collaboratively \n' + 
  //     'The format of each section should be JSON format as following:  {topic: , locations: , instructions:  ,}';
  //   }
    
  //   let conversationLog = [
  //     { role: 'user', 
  //     content: sys_msg,
  //     // name: interaction.author.username
    
  //   } 
  //   ];

  //   prevMessages.forEach((msg) => {
  //     // if (msg.content.startsWith('!')) return;
  //     if (msg.author.id !== client.user.id && msg.author.bot) return;
  //     if (msg.author.username === 'CN-bot') return;
  //     if(msg.content.startsWith('!')) return;
  //     if (msg.content.startsWith('/')) return;
  //     if (msg.content.startsWith('+')) return;


  //     // if (msg.author.id == client.user.id) {
  //     //   conversationLog.push({
  //     //     role: 'assistant',
  //     //     content: msg.content,
  //     //     name: msg.author.username
  //     //       .replace(/\s+/g, '_')
  //     //       .replace(/[^\w\s]/gi, ''),
  //     //   });
  //     // }
      
  //       conversationLog.push({
  //         role: 'user',
  //         content: msg.content,
  //         name: msg.author.username
  //           .replace(/\s+/g, '_')
  //           .replace(/[^\w\s]/gi, ''),
  //     });
    
  //   });
  //   console.log(conversationLog)
    
  //   await interaction.deferReply();
  //   const result = await openai
  //       .createChatCompletion({
  //         model: 'gpt-3.5-turbo',
  //         messages: conversationLog,
  //         max_tokens: 300, // limit token usage
  //       })
  //       .catch((error) => {
  //         console.log(`OPENAI ERR: ${error}`);
  //       });
  //   // console.log(result)
  //   await wait(4000);
  //   await interaction.editReply(result.data.choices[0].message)
  //   // await interaction.editReply('aha')
  // }


  else{
    try{
      await command.execute(interaction)
    }
    catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    }
  }

  

})









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


