const { SlashCommandBuilder } = require('discord.js');
const https = require('https');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('cnews')
		.setDescription('Get a trending news that is of mutual interest!'),

	async execute(interaction) {
        // console.log("aha")
		// await interaction.reply(`This command is run by ${interaction.user.username}`);
        const request = await https.get('https://api.itapi.cn/api/hotnews/zhihu?key=bZQMOsHBsRWsiDJ5jV8O8NQ9gb', (response) => {
           let res = JSON.parse(reponse)
           console.log(res.msg)
        });
        await interaction.reply(res.msg);

        
	},
};
