const express = require('express')
const app = express();
const port = process.env.PORT || 4000;
const dotenv = require("dotenv");
const cors = require("cors");
require('dotenv/config')
// app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
// app.use(bodyParser.json({ limit: "50mb" }));




const { Client, Collection, Events, GatewayIntentBits, IntentsBitField, SlashCommandBuilder} = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const fs = require('node:fs');
const path = require('node:path');
const wait = require('node:timers/promises').setTimeout;

app.use(
  cors({
    origin: ["http://localhost:3000", "https://cn-gallery.vercel.app"],
  })
);

app.get("/", (req, res) => {
  res.send("Collective Narrative Server");
});

const userRouter = require("./routes/userRoutes");
app.use("/user", userRouter);



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
  // if (interaction.commandName === 'prompt2'){
  //   let prevMessages = await interaction.channel.messages.fetch({ limit: 10 });
  //   prevMessages.reverse();

  //   const sys_msg = 'Can you summarize the input conversations and output a relevant fictional story script with four sections? The sections should be relevent to the conversations and the users should be interested in acting out the script collaboratively \n' + 
  //   'The format of each section should be JSON format as following:  {topic: , locations: , instructions:  ,}';

  //   let conversationLog = [
  //     { role: 'user', 
  //     content: sys_msg,
  //     // name: interaction.author.username
     
  //     }
  //   ]
  //   prevMessages.forEach((msg) => {
  //     // if (msg.content.startsWith('!')) return;
  //     if (msg.author.id !== client.user.id && msg.author.bot) return;
  //     if (msg.author.username === 'CN-bot') return;
  //     if(msg.content.startsWith('!')) return;
  //     if (msg.content.startsWith('/')) return;
      
  //       conversationLog.push({
  //         role: 'user',
  //         content: msg.content,
  //         name: msg.author.username
  //           .replace(/\s+/g, '_')
  //           .replace(/[^\w\s]/gi, ''),
  //     });

  // });
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
      
  //   await wait(4000);
  //   await interaction.editReply(result.data.choices[0].message)

  // }



  //get the gpt stuff work
  if(interaction.commandName === 'prompt'){
    
    let prevMessages = await interaction.channel.messages.fetch({ limit: 15 });
    prevMessages.reverse();

    let sys_msg = ''
    let type = interaction.options.getString('type');
    if(type === '1'){
      // sys_msg = 'Can you summarize the input conversations and output a relevant video framework with four sections? The sections should be relevent to what the users are up to and successfully captures the daily routine they have based on the conversation. They would be able to contribute to it collaboratively \n' + 
      // 'For example, if the conversation revolves around a couple studying abroad in different countries, one section of your output should have a JSON-like format as the following: \n'+
      // 'title: A Day in Our Lives' +
      // 'Scene 1: {topic: Studying/Working from home, Locations: [University Library, Classroom, Local Coffeeshop, Park], Description: Share the moment of studying }';

      sys_msg = 'Can you summarize the input conversations and output a relevant video framework with four sections? The sections should be relevent to what the users are up to and successfully captures the daily routine they have based on the conversation. They would be able to contribute to it collaboratively \n' + 
      'The output should be of JSON format with four sections. The format of each section should have a JSON format with three fields as the following: {topic: , locations: , instructions: ,}'
    }
    else if(type === '2'){
      sys_msg = 'Can you summarize the input conversations and output a relevant fictional story script with four sections? The sections should be relevent to the conversations and the users should be interested in acting out the script collaboratively \n' + 
      'The format of each section should be JSON format as following:  {topic: , locations: , instructions:  ,}';
    }
    
    let conversationLog = [
      { role: 'user', 
      content: sys_msg,
      // name: interaction.author.username
    
    } 
    ];

    prevMessages.forEach((msg) => {
      // if (msg.content.startsWith('!')) return;
      if (msg.author.id !== client.user.id && msg.author.bot) return;
      if (msg.author.username === 'CN-bot') return;
      if(msg.content.startsWith('!')) return;
      if (msg.content.startsWith('/')) return;
      if (msg.content.startsWith('+')) return;


      // if (msg.author.id == client.user.id) {
      //   conversationLog.push({
      //     role: 'assistant',
      //     content: msg.content,
      //     name: msg.author.username
      //       .replace(/\s+/g, '_')
      //       .replace(/[^\w\s]/gi, ''),
      //   });
      // }
      
        conversationLog.push({
          role: 'user',
          content: msg.content,
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
      
    await wait(4000);
    await interaction.editReply(result.data.choices[0].message)
    // await interaction.editReply('aha')
  }
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
        // if (msg.content.startsWith('!')) return;
      //   if (msg.author.id !== client.user.id && message.author.bot) return;

      //   if (msg.author.id == client.user.id) {
      //     conversationLog.push({
      //       role: 'assistant',
      //       content: msg.content,
      //       name: msg.author.username
      //         .replace(/\s+/g, '_')
      //         .replace(/[^\w\s]/gi, ''),
      //     });
      //   }
  
      //   if (msg.author.id == message.author.id && !msg.content.startsWith('!')) {
      //     conversationLog.push({
      //       role: 'user',
      //       content: msg.content,
      //       name: message.author.username
      //         .replace(/\s+/g, '_')
      //         .replace(/[^\w\s]/gi, ''),
      //     });
      //   }
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


