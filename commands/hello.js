const Discord = require("discord.js");
 
module.exports.run = async (lanisBot, message, args) => {
    let thumbnail = lanisBot.user.displayAvatarURL;
       
    let reply = new Discord.RichEmbed()
    .setColor("#00FF00")
    .setThumbnail(thumbnail)
    .addField("Bot Name", lanisBot.user.username)
    .setDescription("Hello, is it me you're looking for?");
 
    return message.channel.send(reply);
}
 
module.exports.help = {
    name: "hello"
}
 