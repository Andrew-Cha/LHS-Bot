const Discord = require("discord.js");
 
module.exports.run = async (lanisBot, message, args) => {
    return lanisBot.channels.get("433117430588375040").send("@everyone\nIf you are a rusher make sure to react with <:cloakOfThePlanewalker:538686441278930955>")
}
 
module.exports.help = {
    name: "hello",
    category: "Bot",
    example: "`-hello`",
    explanation: "Tests the basic functionality of the bot, a remnant from the old days of the bot."
}
 