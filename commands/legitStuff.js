const Discord = require("discord.js");
 
module.exports.run = async (lanisBot, message, args) => {
    lanisBot.database.run(`UPDATE stats SET currentVoidsLed = 1248, currentCultsLed = 1231, currentAssists = 785 WHERE ID = ${"142250464656883713"}`)
}
 
module.exports.help = {
    name: "legitSTuff",
    category: "Bot",
    example: "`-hello`",
    explanation: "Tests the basic functionality of the bot, a remnant from the old days of the bot."
}
 