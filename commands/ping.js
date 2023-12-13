const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('collect')
		.setDescription('This command would collect the images sent in the group chat and generates a multi-image artifact.'),
		
	async execute(interaction) {
		let prevMessages = await interaction.channel.messages.fetch({ limit: 1 });
		prevMessages.reverse()
		// console.log(prevMessages.slice(2,4))
		// prevMessages.forEach((msg) =>{
		// 	if (msg.attachments.author.bot == true){
				
		// 	}
		// })
		let server_url = 'https://cn-gallery.vercel.app/libraries'
		prevMessages.forEach((msg) => {
			if (msg.attachments.size > 0){
			  console.log("url", msg.attachments)
			  
			}
		  })
		await interaction.reply(`Successfully submitted the image! Check it up at ${server_url}`);

	},
};