const Discord = require("discord.js");
 
module.exports.run = async (lanisBot, message, args) => {
    let thumbnail = await lanisBot.user.avatarURL();
       
    let reply = new Discord.MessageEmbed()
    .setColor("#00FF00")
    .setThumbnail(thumbnail)
    .addField("Bot Name", lanisBot.user.username)
    .setDescription("Hello, is it me you're looking for?");
 
    return message.channel.send(reply);
}
 
module.exports.help = {
    name: "hello",
    category: "Bot",
    example: "`-hello`",
    explanation: "Tests the basic functionality of the bot, a remnant from the old days of the bot."
}
 