const Discord = require("discord.js");
const Roles = require("../dataFiles/roles.json")

module.exports.run = async (lanisBot, message, args) => {
    const securityRole = message.guild.roles.find(role => role.id === Roles.security.id);
    if (message.member.roles.highest.position < securityRole.position && !message.member.roles.find(role => role.id === Roles.verifier.id)) return await message.channel.send("You can not use this command as a non Security or Verifier.");
    const action = args[0];
    if (action === undefined) return await message.channel.send("Input whether you want to `add` or `remove` a person to the Feedback Blacklist, to view the list use the `list` argument.")
    let playerID;
    if (args[1] !== undefined) {
        playerID = args[1].replace(/[^0-9]/g, '')
    }
    if (playerID === null && action.toUpperCase() !== "LIST") return message.channel.send("Please input a user to blacklist or to remove.");
    if (playerID !== undefined) {
        if (playerID.length < 17) return message.channel.send("Please input a correct User ID or mention.")
    }

    let memberExpelled = false

    lanisBot.database.get(`SELECT * FROM feedbackBlacklist WHERE ID = '${playerID}'`, async (error, row) => {
        if (error) {
            throw error
        }
        if (row !== undefined) memberExpelled = true

        switch (action.toUpperCase()) {
            case "ADD":
                if (!memberExpelled) {
                    lanisBot.database.run(`INSERT INTO feedbackBlacklist(ID) VALUES('${playerID}')`, (error, row) => {
                        if (error) {
                            throw error
                        }
                    })
                    await message.channel.send(`<@${playerID}> is now blacklisted from adding feedback.`)
                } else {
                    return await message.channel.send(`<@${playerID}> is already blacklisted from adding feedback.`);
                }
                break;

            case "REMOVE":
                if (memberExpelled) {
                    lanisBot.database.run(`DELETE FROM feedbackBlacklist WHERE ID = '${playerID}'`)
                    await message.channel.send(`<@${playerID}> is now unblacklisted and can add feedback.`);
                } else {
                    return await message.channel.send(`<@${playerID}> is not blacklisted from adding feedback.`);
                }
                break;

            case "LIST":
                let reportMessage = "**Feedback Blacklist**\n";
                lanisBot.database.all(`SELECT * FROM feedbackBlacklist`, async (err, rows) => {
                    let expelledPeople = rows.map(row => row.ID)

                    for (const person of expelledPeople) {
                        const newReportMessage = reportMessage + `<@${person}>`
                        if (newReportMessage.length > 1900) {
                            reportMessage = reportMessage + "\n";
                            await message.channel.send(reportMessage);
                            reportMessage = "\n" + person;
                        } else {
                            reportMessage = newReportMessage;
                        }
                    }

                    await message.channel.send(reportMessage);
                })

                break;
            default:
                return await message.channel.send("Input a correct action, either `add`,`remove` or `list`.");
        }
    })
}

module.exports.help = {
    name: "feedbackBlacklist",
    category: "Server Management",
    example: "`-feedbackBlacklist list` | `-feedbackBlacklist [remove / add] Name`",
    explanation: "Used to add people to the feedback blacklist, which prevents them from sending further feedback through the mod mail."
}