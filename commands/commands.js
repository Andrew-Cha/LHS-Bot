const Discord = require("discord.js");

module.exports.run = async (lanisBot, message, args) => {
    let reply = new Discord.RichEmbed()
        .addField("//afk X", "Makes an afk check for a specified raiding channel. Usage: //afk X, X being the raid channel.")
        .addField("//cult X", "Takes all the people who reacted to the cult emoji, if there are not enough people takes the missing amount. If noone reacts to cult it takes 15% of people. Usage: //cult X, X being the current raiding channel you want to split")
        .addField("//dice", "Rolls a 20 sided dice and totally gives a random result, because computers can generate random results... Right?")
        .addField("//hello", "Says hello.")
        .addField("//say X", "Repeats the argument sent with this message, in this case X")
        .addField("//splitVoid X", "Starts a void split check for the specified channel, tries to form groups if possible, splits people evenly among the max possible formed groups, moves all the people who didn't react to the cult voice chat. Usage: //splitVoid X, X being the raiding channel to do the split for." )
        await message.channel.send(reply);
}

module.exports.help = {
    name: "commands"
}