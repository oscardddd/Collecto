const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('prompt')
		.setDescription('Get a relevant story topic!')
		.addStringOption(option =>
			option.setName('type')
			.setDescription('The type of prompt')
			.setRequired(true)
			.addChoices(
				{name:	'actual',  value: '1'},
				{name:	'fictional', value: '2'},

			)),

	async execute(interaction) {
		await interaction.reply(`This command is run by ${interaction.user.username}`);
	},
};