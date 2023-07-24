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
  // else if (interaction.commandName === 'past'){
  //   let prevMessages = await interaction.channel.messages.fetch({ limit: 15 });
  //   prevMessages.reverse();
  //   // console.log(prevMessages)
  //   // let sys_msg = 'We are doing a past memory sharing activity, \
  //   // where people would share pictures with descriptions of their past experiences. you are an AI assistant who would be given a converation, and you should generate 5 possible sharing topics based on the conversation send to you. '
  //   // let sys_msg = 'Can you summarize the 5 main topics of the conversation happened in the discord channel? The conversation is as following:'
  //   // let sys_msg = 'We are doing a past memory sharing activity, \
  //   // where people share pictures with descriptions of their past experiences. As an AI assistant, you would be given a conversation and the user profiles of all users who involve in the conversation. Can you generate 3 sharing topics based on the common interest of the users out of their conversation and profiles?'
    
  //   // let sys_msg = 'Based on the conversation and the user profile, can you make a guess on what are the possibe interests of all users in the conversation?'
  //   let sys_msg = 'You are an AI assistant. You would first given some user information, and then the conversation the users had. Can you identify the usernames of the people involved in the conversation and come up with 3 topics that the users are mutually interested in based on the user information and the conversation?'
  //   let conversationLog = [
  //     { role: 'user', 
  //     content: sys_msg,
  //     // name: interaction.author.username
    
  //   } 
  //   ];
   
  //   // prevMessages.forEach((msg) => {
  //   //   if (msg.attachments){
  //   //     console.log("url", msg.attachments)
  //   //   }
  //   // })


  //   prevMessages.forEach((msg) => {
  //     // if (msg.content.startsWith('!')) return;
  //     if (msg.author.id !== client.user.id && msg.author.bot) return;
  //     if (msg.author.username === 'CN-bot') return;
  //     if (msg.content.startsWith('!')) return;
  //     if (msg.content.startsWith('/')) return;
  //     if (msg.content.startsWith('+')) return;

  //     conversationLog.push({
  //         role: 'user',
  //         content: msg.author.username + ': '+ msg.content,
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

  // }

  else 
    if(interaction.commandName === 'start'){
    let oscar_profile = 
    '20 year old, student studying computer science. Evanston, IL. \
    I am doing a research project and it goes pretty good. I have built a solid system and I would like to test it this weekend!\
    Last week I went to a potluck for the first time in my life, I asked some people to help me with my resume, I went to a fancy Japanese restaurant!\
    My life goal at the moment is to attain inner peace and try to find a career path '

    let kazi_profile = 
    '20 year old, college student studying big data. Hangzhou, China.  \
    Last week I went to a concert with my high school friends, I went a good Hangzhou cuisine, and I learned to write multi-thread compiter programs.\
    My life goal at the moment is to travel around the world'

    let sys_msg = 'You are an AI assistant who would provide a conversation topic that is of mutual interest to the users that is having a high school classmates reunion. Based on the prior survey questions below, can you generate 3 topics that is of mutual interest with explanations?' 

    let nc_profile = 
    '20 year old, college student studying economics and math. Chicago, IL. \
    Last week I had a motorbike ride with my friends, I started my new internship of investment banking, and I re-visited my high school two years after graduation. \
    My life goal at the moment is to get a good GRE grade.'
    
    let andy_profile = 
    '20 year old, college student studying math. now in Shanghai, China' + 
    'My favorite part about my current school is 自由时间比较多'+
    'Three thinsg I am working on these days are: 产品运营 数据库推荐 竞品分析'+
    'City I wanna visit: 哥本哈根 大阪 南极' +
    'My life goal rn is 在上海找份工作'




    let zyf_profile = 
    '20 year old, college student studying finance. now in Jinan, China' +
    'My favorite part of my school is Reputation and small class-size.' +
    'Three thinsg I am working on these days are: Internship, spending time with family, networking'+
    'City I wanna visit: Hong Kong, London, Canton' +
    'My life goal rn is Hope my mom will recover soon & end up with a good graduate program'

    let haoran_profile = 
    '20 year old, college student studying econ. now in Jinan, China'+
    'My favorite part of my school is Sense of community, diversity, inclusiveness.' +
    'City I wanna visit: Paris, Berlin, Invercargill.' +
    'Three things I am working on these days are Life. Money. Career.'+
    'My life goal rn is Be happy'


    let zyf_profile2 = 
    'Music/movie/book/TV: 英雄; ' +
    'Hobby and interest: Smoking;  ' +
    'Sports: Soccer 山东泰山' +
    'Technology: Apple ' +
    'Gaming: WildRift' + 
    'Professional background: Investment Banking; '+
    'Academic: Student studying Econ; '+
    'Goals and aspirations: Pussy, Money, Fame '

    let oscar_profile2 = 
    'Music/movie/book/TV shows: Ocean Eyes; ' +
    'Hobby and interest: Basketball;  ' +
    'Sports: Lakers!;  ' +
    'Technology: Vision Pro?;  ' +
    'Gaming: Civ 6; ' + 
    'Professional background: No experience; '+
    'Academic l: Student studying CS; '+
    'Goals and aspirations: make money babe; '

    let oscardd5_profile3 = 
    ''
    

    let conversationLog = [
      { role: 'user', 
      content: sys_msg,
      // name: interaction.author.username
    }]
   
    conversationLog.push({
      role: 'user',
      content: 'survey of oscardd5: '+ oscar_profile
    });
    conversationLog.push({
      role: 'user',
      content: 'survey of _234kia: '+ andy_profile

    });
    
    console.log(conversationLog)
    await interaction.deferReply();

    const result = await openai
        .createChatCompletion({
          model: 'gpt-3.5-turbo',
          messages: conversationLog,
          max_tokens: 300, // limit token usage
          temperature: 0.8
        })
        .catch((error) => {
          console.log(`OPENAI ERR: ${error}`);
        });
    // console.log(result)
    await wait(4000);
    await interaction.editReply(result.data.choices[0].message)
    
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


