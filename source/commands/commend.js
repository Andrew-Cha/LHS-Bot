const Discord = require("discord.js");

module.exports.run = async (client, message, args) => {
    const guild = client.guilds.get("343704644712923138");
    let member;
    let input = args[0]
    if (input === undefined) {
        member = await guild.members.fetch(message.author.id)
    } else {
        //Try to grab numbers only
        let inputReplaced = input.replace(/[^0-9]/g, '')
        if (inputReplaced.length < 17) {
            let searchResult = guild.members.find(member => member.displayName.toUpperCase() == input.toUpperCase())
            if (searchResult !== undefined) {
                member = await guild.members.fetch(searchResult)
            } else {
                await message.react("⚠")
                const errorMessage = await message.channel.send("Sorry, can't find this member.")
                if (message.channel.type !== "dm") {
                    await sleep(10000)
                    await errorMessage.delete()
                    await message.delete()
                }
                return
            }
        } else {
            member = await guild.members.fetch(inputReplaced)
        }
    }

    if (member === undefined) {
        await message.react("⚠")
        if (message.channel.type !== "dm") {
            await sleep(10000)
            await errorMessage.delete()
            await message.delete()
        }
        return
    }

    if (member.id === message.author.id) return message.channel.send("Sorry, you can't commend yourself.")
    client.database.get(`SELECT * FROM stats WHERE ID = '${member.id}';`, async (error, row) => {
        let newCommendations;
        if (row.commendedBy !== null && row.commendedBy !== "" && row.commendedBy !== undefined) {
            newCommendations = row.commendedBy.split(",")
            if (!newCommendations.includes(message.author.id)) {
                newCommendations.push(message.author.id)
            } else {
                return message.channel.send("You have already commended " + member.toString())
            }
        } else {
            newCommendations = [`${message.author.id}`]
        }

        client.database.run(`UPDATE stats SET commendedBy = '${newCommendations.join(",")}', commendations = commendations + 1 WHERE ID = '${member.id}'`)
        await message.channel.send("Commended " + member.toString() + ", they now have " + newCommendations.length + " commendations.")

        if (newCommendations.length >= 3) {
            const rusherRole = message.guild.roles.find(role => role.name === "Official Rusher")
            await member.roles.add(rusherRole)
        }
    })
}

module.exports.help = {
    name: "commend",
    category: "Bot",
    example: "`-commend [User Mention / User ID / Nickname]`",
    explanation: "Commends a person, once 3 commendations are reached, the person gets Official Rusher."
}
