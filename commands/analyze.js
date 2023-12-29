const { SlashCommandBuilder } = require('discord.js');
const https = require('https');
const { Configuration, OpenAIApi } = require('openai');
const wait = require('node:timers/promises').setTimeout;
const axios = require('axios');
const { send } = require('process');
const dbConnection = require('../dbCall.js')


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

		let date_now = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds
		// prints date in YYYY-MM-DD HH:MM:SS format
		console.log(year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds);
		let sys_msg = `You are an AI assistant. Based on the previous conversations, can you help identify the important event mentiond during the conversation that comes with a specific time frame?\
		For example, If user Tim said to Amy that he would have a birthday party next wednesday at 10 am, you should only return a list of JSON objects with no explanations [{"sender": "Tim", "time": 2023-12-19 10:00:00, "event": "Birthday party"}].\
		You should convert the time to SQL timestamp based on the timestamp right now: ${date_now}. You should use 00:00:00 as the time if no specific hour is mentioned. Return [ ] if the provided conversation does not have enough information.`
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
			  content: msg.author.id + ': '+ msg.content,
			  name: msg.author.username
				.replace(/\s+/g, '_')
				.replace(/[^\w\s]/gi, ''),
		  });
		
		});
		console.log(conversationLog)
	
		// await interaction.deferReply();
	
		openai
			.createChatCompletion({
			  model: 'gpt-4',
			  messages: conversationLog,
			  max_tokens: 300, // limit token usage
			})
			.then(async (result)=>{
				await wait(4000);
		try{
			let data1 = result.data.choices[0].message.content
			// console.log(data1)
			let data2 = await JSON.parse(data1);
			console.log(data2)
			let sender = ''
			let timeStamp = ''
			let event = ''

			await data2.forEach(item => {
				sender = item.sender
				timeStamp = (new Date(item.time)).toISOString().slice(0, 19).replace('T', ' ');
				event = item.event
				// let receiver = item.receiver
				console.log("sender: ", sender)
				console.log("time: ", timeStamp)
			})
			
			console.log("aha")
			let sql = `INSERT INTO events (sender, receiver, time, eventname) 
			VALUES ('${sender}', 'None', '${timeStamp}', '${event}')`

			console.log("sql: ", sql)

			await dbConnection.query(sql, async(error, res, _) => {
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
		
	},
};