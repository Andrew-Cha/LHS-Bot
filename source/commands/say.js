const Discord = require("discord.js");

module.exports.run = async (client, message, args) => {
   // if (!message.member.hasPermission("ADMINISTRATOR")) return;

    let returnMessage = args.join(" ");

    message.channel.send(returnMessage);
}

module.exports.help = {
    name: "say",
    category: "Bot",
    example: "`-say Hello!`",
    explanation: "The bot repeats what you tell it to repeat."
}