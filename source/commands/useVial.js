const Discord = require("discord.js");
const Channels = require("../dataFiles/channels.json");

module.exports.run = async (lanisBot, message, args) => {
    let userID = args[0]
    if (userID === undefined) return message.channel.send("Please input a user.")
    //Try to grab numbers only
    let inputReplaced = userID.replace(/[^0-9]/g, '')
    if (inputReplaced.length < 17) return await message.channel.send("Input a user mention or their ID.")
    userID = inputReplaced

    lanisBot.database.get(`SELECT * FROM stats WHERE ID = '${userID}'`, (error, row) => {
        if (row === undefined) return message.channel.send("User not found.")
        if (row.vialsStored > 0) {
            lanisBot.database.run(`UPDATE stats SET vialsStored = vialsStored - 1, vialsUsed = vialsUsed + 1 WHERE ID = '${userID}';`)
            lanisBot.channels.get(Channels.vialLogs.id).send(`Vial popped by <@${userID}>, logged by ${message.member.toString()}. (${row.vialsStored - 1} remaining vials)`)
        } else {
            lanisBot.database.run(`UPDATE stats SET vialsUsed = vialsUsed + 1 WHERE ID = '${userID}';`)
            lanisBot.channels.get(Channels.vialLogs.id).send(`Vial popped by <@${userID}>, logged by ${message.member.toString()}. (No logged vials found)`)
        }
        
    })
}

module.exports.help = {
    name: "useVial",
    category: "Raiding",
    example: "`-useVial [User Mention]`",
    explanation: "Removes one vial from the mentioned user's profile."
}
