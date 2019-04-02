const Discord = require("discord.js");
 
module.exports.run = async (client, message, args) => {
    return message.channel.send("Hey so uh.. Work in progress.")
}
 
module.exports.help = {
    name: "vial",
    category: "Raiding",
    example: "`-vial`",
    explanation: "Used to log vials."
}
 