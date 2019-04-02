const Discord =  require(`discord.js`)
const Config = require(`../data/config`)
const Bot = require(`./client`)

const client = new Discord.Client()
new Bot(client).initiate()

client.login(Config.token)