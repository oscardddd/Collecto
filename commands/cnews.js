const { SlashCommandBuilder } = require('discord.js');
const https = require('https');
const { Configuration, OpenAIApi } = require('openai');
const wait = require('node:timers/promises').setTimeout;
const axios = require('axios')


module.exports = {
	data: new SlashCommandBuilder()
		.setName('cnews')
		.setDescription('Get a trending news that is of mutual interest!'),

	async execute(interaction) {
        const configuration = new Configuration({
            apiKey: process.env.OPEN_AI,
        });
        const openai = new OpenAIApi(configuration);
        let sys_msg = 
        `你是一个帮助用户寻找共同话题的小助手,请你基于之前他们的聊天记录,总结出他们最感兴趣的三种话题, 并根据这三种话题, 从今日新闻中选出老朋友们最感兴趣的三条新闻, 请返回一个 JSON 格式, 包含三个话题, 每个话题对应一条新闻. 举个例子: 
        {
           "topics": [
              {
                "topic": "",
                "news": ""
              },
              {
                "topic": "",
                "news": ""
              },
              {
                "topic": "",
                "news": ""
              }
           ]
        }`;
        let conversationLog = [
            { role: 'user', 
            content: sys_msg,
            // name: interaction.author.username
          
          } 
        ];
        let prevMessages = await interaction.channel.messages.fetch({ limit: 25 });
        conversationLog.push({
            role: 'user',
            content: "这是用户之前的聊天记录: " 
        })
        prevMessages.reverse();

        prevMessages.forEach((msg) => {
            if (msg.author.username === 'CN-bot') return;
            if(msg.content.startsWith('!')) return
            if(msg.content.startsWith('/')) return
      
            conversationLog.push({
              role: 'user',
              content: msg.content,
            });
        });
        let prevnews = ""
        await wait(5000);
        await axios.get('https://api.itapi.cn/api/hotnews/zhihu?key=bZQMOsHBsRWsiDJ5jV8O8NQ9gb').then(res =>{
        if (res.data.msg === '请求成功'){
            let data = res.data.data
            // console.log(data)
            data.forEach((news)=>{
              prevnews += news.name + ", "
            })
            
          }
        }).catch(error =>{
          console.log(error)
        })
        conversationLog.push({
            role:"user",
            content:"这是今日的热点新闻, separated by comma:" + prevnews,
        })
        const result = await openai
        .createChatCompletion({
            model: 'gpt-4',
            messages: conversationLog,
            // max_tokens: 256, // limit token usage
        })
        .catch((error) => {
            console.log(`OPENAI ERR: ${error}`);
        });
        console.log(result.data.choices[0].message)
        let res = result.data.choices[0].message
        let res2 = JSON.parse(res)
        console.log(res.topics)
        await interaction.editReply(result.data.choices[0].message);  



        
	},
};
