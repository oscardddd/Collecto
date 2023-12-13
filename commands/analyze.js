const { SlashCommandBuilder } = require('discord.js');
const https = require('https');
const { Configuration, OpenAIApi } = require('openai');
const wait = require('node:timers/promises').setTimeout;
const axios = require('axios')



module.exports = {
	data: new SlashCommandBuilder()
		.setName('analyze')
		.setDescription('Identify the impoertant time frame in the conversations'),
	async execute(interaction) {
		await interaction.editReply("aha, magic")
		const configuration = new Configuration({
            apiKey: process.env.OPEN_AI,
        });
        const openai = new OpenAIApi(configuration);
		let prevMessages = await interaction.channel.messages.fetch({ limit: 5 });
		prevMessages.reverse();
		let sys_msg = 'You are an AI assistant. Based on the previous conversations, can you help identify the important event mentiond during the conversation that comes with a specific time frame?\
		For example, If user Tim said to Amy that he would have a birthday party next wednesday at 10 am, you should only return a list of JSON objects with no explanations [{"sender": "Tim", "receiver":"Amy", "time": 2023-12-19 10:00:00, "event": "Birthday party"}].\
		You should convert the time to SQL timestamp based on the timestamp right now: 2023-12-13 03:34:35. You should use 00:00:00 as the time if no specific hour is mentioned.'
		let conversationLog = [
		  { role: 'user', 
		  content: sys_msg,
		  // name: interaction.author.username
		} 
		];
	   
		prevMessages.forEach((msg) => {
		  // if (msg.content.startsWith('!')) return;
		  if (msg.author.bot) return;
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
	
		// await interaction.deferReply();
	
		const result = await openai
			.createChatCompletion({
			  model: 'gpt-4',
			  messages: conversationLog,
			  max_tokens: 300, // limit token usage
			})
			// .then(result =>{
			// 	let data1 = result.data.choices[0]
			// 	let data2 = JSON.parse(data1);
			// 	console.log(data2)
			// })
			.catch((error) => {
			  console.log(`OPENAI ERR: ${error}`);
			});
		// console.log(result)
		await wait(4000);
		try{
			let data1 = result.data.choices[0]
			let data2 = JSON.parse(data1);
			console.log(data2)
			data2.forEach(item => {
				let sender = item.sender
				let timeStamp = (new Date(item.time)).toISOString().slice(0, 19).replace('T', ' ');
				let event = item.event
				let receiver = item.receiver
				console.log(sender, receiver, timeStamp, event)
			  });
		
			let sql = `INSERT INTO events (sender, receiver, time, eventname) 
			VALUES (${sender}, ${receiver}, ${time}, ${event})`

			dbConnection.query(sql, async(error, res, _) => {
				if (error) {
				  console.log("Error: ", error);
				//   await interaction.editReply("db success")

				} else {
				  console.log("db success: ", JSON.stringify(res))
				//   await interaction.editReply("db success")
				}
			  })	
		}
		catch(error){
			console.log("error while inserting into database: ", error)
		}
	},
};