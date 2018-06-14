const Discord = require("discord.js");
const channels = require("../channels.json");

module.exports.run = async (lanisBot, message, args) => {
    let diceRoll = Math.floor(Math.random() * 20) + 1;

    let thumbnail = lanisBot.user.displayAvatarURL;

    let reply = new Discord.RichEmbed()
        .setColor("#00FF00")
        .setThumbnail(thumbnail)
        .addField("Bot Name", lanisBot.user.username)
        .setDescription(`I rolled a 20 sided dice and the outcome was: ${diceRoll}`);

    return message.channel.send(reply);
}

module.exports.help = {
    name: "dice"
}