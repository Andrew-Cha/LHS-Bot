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

    if (member.id === message.author.id) return message.channel.send("Sorry, you can't revoke commend yourself.")

    client.database.get(`SELECT * FROM stats WHERE ID = '${member.id}';`, async (error, row) => {
        let newCommendations;
        if (row.commendedBy !== null && row.commendedBy !== "" && row.commendedBy !== undefined) {
            newCommendations = row.commendedBy.split(",")
            if (newCommendations.includes(message.author.id)) {
                newCommendations.remove(message.author.id)
            } else {
                return message.channel.send("You haven't commended " + member.toString())
            }
        } else {
            return message.channel.send(member.toString() + " doesn't have any commendations.")
        }

        client.database.run(`UPDATE stats SET commendedBy = '${newCommendations.join(",")}', commendations = commendations - 1 WHERE ID = '${member.id}'`)
        await message.channel.send("Revoked commendation from " + member.toString() + ", they now have " + newCommendations.length + " commendations.")
    })
}
 
module.exports.help = {
    name: "revokeCommend",
    category: "Bot",
    example: "`-revokeCommend [User Mention / User ID / Nickname]`",
    explanation: "Revokes a commendation from the mentioned user."
}
 
Array.prototype.remove = function () {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};