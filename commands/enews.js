const { default: axios } = require('axios');
const { error } = require('console');
const { SlashCommandBuilder } = require('discord.js');
const { json } = require('express');
const https = require('https');
const wait = require('node:timers/promises').setTimeout;
const { Configuration, OpenAIApi } = require('openai');

module.exports = {
    
        data: new SlashCommandBuilder()
		.setName('enews')
		.setDescription('Get trending news that is of mutual interest!'),
        // interaction.deferReply()

        execute: async(interaction)=>{
            
            const configuration = new Configuration({
                apiKey: process.env.OPEN_AI,
            });
              
            const openai = new OpenAIApi(configuration);
              
            try{
                let prevnews = ""
                let q = "什么是爱情"
                const result = await openai
                .createChatCompletion({
                  model: 'gpt-4',
                  messages: [{"role": "user", "content": "Hello world"}],
                  max_tokens: 100, // limit token usage
                })
                .catch((error) => {
                  console.log(`OPENAI ERR ${error}`);
                });
                await wait(4000);
                // console.log(result)
                await interaction.editReply(result.data.choices[0].message)
            //     await axios.get('https://api.itapi.cn/api/hotnews/zhihu?key=bZQMOsHBsRWsiDJ5jV8O8NQ9gb').then(res =>{
            //     if (res.data.msg === '请求成功'){
            //         let data = res.data.data
            //         console.log(data)
            //         data.forEach((news)=>{
            //             prevnews += news.name + ", "
                        
            //         })
                    
                    
            //     }
            // }).catch(error =>{
            //     console.log(error)
            // })
            // await interaction.reply(prevnews)
            
        }
            catch(err){
                console.log(err)
            }
            

        
        },
    
    
	
    
  
	
};
