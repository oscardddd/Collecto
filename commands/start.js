const { SlashCommandBuilder } = require('discord.js');
const https = require('https');
const { Configuration, OpenAIApi } = require('openai');
const wait = require('node:timers/promises').setTimeout;
const axios = require('axios')
const dbConnection = require('../dbCall.js')


module.exports = {
	data: new SlashCommandBuilder()
		.setName('start')
		.setDescription('Get a relevant topic to talk about!'),
	async execute(interaction) {
		try {
			let sql = `select * FROM events`
			dbConnection.query(sql, async(error, data, _) => {
			  if (error) {
				console.log("Error: ", error);
			  } else {
				console.log("db success: ", JSON.stringify(data))
				await interaction.editReply("db success")
			  }
			})	
		  }
		  //try
		  catch (err) {
			await interaction.editReply("error getting data from database")

		  }//catch
	}
};

