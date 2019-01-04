const Discord = require("discord.js");
 
module.exports.run = async (lanisBot, message, args) => {

       
    let reply = new Discord.MessageEmbed()
    .setColor("#4286f4")
    .addField("Mod Mail", "If you want to give feedback or ask a question to the Moderation team, go ahead and message me, the bot!\nRaid Leaders aren't able to see this feedback & spamming it may get you banned from the server or blacklisted from sending further mod mail.")
    .setFooter(`If your feedback is successfully received it will receive a 📧 reaction to your message.`)
 
    message.guild.channels.get("526466244333797408").send(reply)
}
 
module.exports.help = {
    name: "modmailReset",
    category: "Server Management",
    example: "`-modmailReset`",
    explanation: "Used to resend the message found in the public Mod Mail channel."
}
 