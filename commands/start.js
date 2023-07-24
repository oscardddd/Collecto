const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('start')
		.setDescription('Get a relevant topic to talk about!'),
	async execute(interaction) {
		await interaction.reply(`This command is run by ${interaction.user.username}`);
	},
};

