const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('analyze')
		.setDescription('Identify the impoertant time frame in the conversations'),
	async execute(interaction) {
		await interaction.reply(`This command is run by ${interaction.user.username}`);
	},
};