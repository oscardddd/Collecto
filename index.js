
require('dotenv/config');
const { Client, Collection, Events, GatewayIntentBits, IntentsBitField, SlashCommandBuilder} = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const fs = require('node:fs');
const path = require('node:path');
const wait = require('node:timers/promises').setTimeout;


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
  
  //get the gpt stuff work
  if(interaction.commandName === 'prompt'){
    let conversationLog = [
      { role: 'system', 
      content: 'You are a lakers fan'},
      {
        role: 'user',
        content: 'Who is the GOAT player of NBA history'
      }
    ];
    const result = await openai
        .createChatCompletion({
          model: 'gpt-3.5-turbo',
          messages: conversationLog,
          max_tokens: 50, // limit token usage
        })
        .catch((error) => {
          console.log(`OPENAI ERR: ${error}`);
        });
    await interaction.deferReply();
    await wait(4000);
    await interaction.editReply(result.data.choices[0].message)
  }

  // try{
  //   await command.execute(interaction)
  // }
  // catch (error) {
	// 	console.error(error);
	// 	if (interaction.replied || interaction.deferred) {
	// 		await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
	// 	} else {
	// 		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	// 	}
	// }

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
      content: 'You are a script writer who would generate story topics relevant to the user input' },
      
  
    ];
    try {
      await message.channel.sendTyping();
      let prevMessages = await message.channel.messages.fetch({ limit: 5 });
      prevMessages.reverse();
      
      prevMessages.forEach((msg) => {
        // if (msg.content.startsWith('!')) return;
        if (msg.author.id !== client.user.id && message.author.bot) return;
        if (msg.author.id == client.user.id) {
          conversationLog.push({
            role: 'assistant',
            content: msg.content,
            name: msg.author.username
              .replace(/\s+/g, '_')
              .replace(/[^\w\s]/gi, ''),
          });
        }
  
        if (msg.author.id == message.author.id) {
          conversationLog.push({
            role: 'user',
            content: msg.content,
            name: message.author.username
              .replace(/\s+/g, '_')
              .replace(/[^\w\s]/gi, ''),
          });
        }
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
      message.reply(result.data.choices[0].message);
    } catch (error) {
      console.log(`ERR: ${error}`);
    }
  }

  

 
});

client.login(process.env.TOKEN);


