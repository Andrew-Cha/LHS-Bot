const Discord = require("discord.js");
const Channels = require("../../data/channels.json");

module.exports.run = async (client, message, args) => {
    let userID = args[0]
    if (userID === undefined) return message.channel.send("Please input a user.")
    //Try to grab numbers only
    let inputReplaced = userID.replace(/[^0-9]/g, '')
    if (inputReplaced.length < 17) return await message.channel.send("Input a user mention or their ID.")
    userID = inputReplaced

    client.database.get(`SELECT * FROM stats WHERE ID = '${userID}'`, (error, row) => {
        if (row === undefined) return message.channel.send("User not found.")
        client.database.run(`UPDATE stats SET vialsStored = vialsStored + 1 WHERE ID = '${userID}';`)
        client.channels.get(Channels.vialLogs.id).send(`Vial added for <@${userID}> by ${message.member.toString()}. (${row.vialsStored + 1} remaining vials)`)
    })
}

module.exports.help = {
    name: "addVial",
    category: "Raiding",
    example: "`-addVial [User Mention]`",
    explanation: "Adds one vial from the mentioned user's profile."
}