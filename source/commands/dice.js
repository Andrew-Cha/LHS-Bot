const Discord = require("discord.js");
const channels = require("../../data/channels.json");

module.exports.run = async (client, message, args) => {
    let diceRoll = Math.floor(Math.random() * 20) + 1;

    let thumbnail = await client.user.avatarURL();

    let reply = new Discord.MessageEmbed()
        .setColor("#00FF00")
        .setThumbnail(thumbnail)
        .addField("Bot Name", client.user.username)
        .setDescription(`I rolled a 20 sided dice and the outcome was: ${diceRoll}`);

    return message.channel.send(reply);
}

module.exports.help = {
    name: "dice",
    category: "Miscellaneous",
    example: "`-dice`",
    explanation: "A command from early days of the bot, rolls a 20 sided dice and returns a number 1-20."
}