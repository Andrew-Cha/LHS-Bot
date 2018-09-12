const Discord = require("discord.js");

module.exports.run = async (lanisBot, message, args) => {
   // if (!message.member.hasPermission("ADMINISTRATOR")) return;

    let returnMessage = args.join(" ");

    message.channel.send(returnMessage + message.member.toString());
}

module.exports.help = {
    name: "say"
}