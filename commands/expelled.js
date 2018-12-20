const Roles = require("../dataFiles/roles.json")

module.exports.run = async (lanisBot, message, args) => {
    const securityRole = message.guild.roles.find(role => role.id === Roles.security.id);
    if (message.member.roles.highest.position < securityRole.position && !message.member.roles.find(role => role.id === Roles.verifier.id)) return await message.channel.send("You can not use this command as a non Security or Verifier.");
    const action = args[0];
    if (action === undefined) return await message.channel.send("Input whether you want to `add` or `remove` a person to the expelled people list, to view the list use the `list` argument.")
    let playerName = args[1]
    if (playerName === undefined && action.toUpperCase() !== "LIST") return message.channel.send("Please input a user to expel or unban.");
    if (playerName) {
        if (playerName.length > 10) return message.channel.send("Nicknames can't be longer than 10 characters long.");
    }

    const playerNameUppercased = playerName !== undefined ? playerName.toUpperCase() : ""
    const actionUpperCase = action.toUpperCase();
    let memberExpelled = false

    lanisBot.database.get(`SELECT * FROM expelled WHERE name = '${playerNameUppercased}'`, async (error, row) => {
        if (error) {
            throw error
        }
        if (row !== undefined) memberExpelled = true

        switch (actionUpperCase) {
            case "ADD":
                if (!memberExpelled) {
                    lanisBot.database.run(`INSERT INTO expelled(name) VALUES('${playerNameUppercased}')`, (error, row) => {
                        if (error) {
                            throw error
                        }
                    })
                    await message.channel.send(`${playerName} is now expelled.`)
                } else {
                    return await message.channel.send(`${playerName} is already expelled.`);
                }
                break;

            case "REMOVE":
                if (memberExpelled) {
                    lanisBot.database.run(`DELETE FROM expelled WHERE name = '${playerNameUppercased}'`)
                    await message.channel.send(`${playerName} is now unexpelled.`);
                } else {
                    return await message.channel.send(`${playerName} is not expelled.`);
                }
                break;

            case "LIST":
                let reportMessage = "**Expelled Players**\n```";
                lanisBot.database.all(`SELECT * FROM expelled`, async (err, rows) => {
                    let expelledPeople = rows.map(row => row.name)

                    expelledPeople.sort(compare);
                    let membersScrolled = 1;
                    for (const person of expelledPeople) {
                        const newReportMessage = reportMessage + person + "; ";
                        if (newReportMessage.length > 1996) {
                            reportMessage = reportMessage + "\n```";
                            await message.channel.send(reportMessage);
                            reportMessage = "```\n" + person;
                        } else {
                            reportMessage = newReportMessage;
                            if (membersScrolled === expelledPeople.length) {
                                reportMessage = reportMessage + "\n```";
                            }
                        }
                        membersScrolled += 1;
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
    name: "expelled"
}


function compare(a, b) {
    if (a < b) {
        return -1;
    }
    if (a > b) {
        return 1;
    }
    return 0;
}