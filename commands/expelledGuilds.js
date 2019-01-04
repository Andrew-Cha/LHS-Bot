const Roles = require("../dataFiles/roles.json")

module.exports.run = async (lanisBot, message, args) => {
    const securityRole = message.guild.roles.find(role => role.id === Roles.security.id);
    if (message.member.roles.highest.position < securityRole.position && !message.member.roles.find(role => role.id === Roles.verifier.id)) return await message.channel.send("You can not use this command as a non Security or Verifier.");
    const action = args[0];
    if (action === undefined) return await message.channel.send("Input whether you want to `add` or `remove` a guild to the expelled guilds list, to view the list use the `list` argument.")
    let guildName = "";
    for (let i = 1; i < args.length; i++) {
        if (i !== 1) {
            guildName = guildName + " " + args[i];
        } else {
            guildName = args[1];
        }
    }
    if (guildName === "" && action.toUpperCase() !== "LIST") return message.channel.send("Please input a guild to expel or unban.");

    const actionUpperCase = action.toUpperCase();
    let guildExpelled = false
    lanisBot.database.get(`SELECT * FROM expelledGuilds WHERE name = '${guildName}'`, async (error, row) => {
        if (error) {
            throw error
        }
        if (row !== undefined) guildExpelled = true
        switch (actionUpperCase) {
            case "ADD":
                if (!guildExpelled) {
                    lanisBot.database.run(`INSERT INTO expelledGuilds(name) VALUES('${guildName}')`)
                    await message.channel.send(`${guildName} is now expelled.`)
                } else {
                    return await message.channel.send(`${guildName} is already expelled.`);
                }
                break;

            case "REMOVE":
                if (guildExpelled) {
                    lanisBot.database.run(`DELETE FROM expelledGuilds WHERE name = '${playerNameUppercased}'`)
                    await message.channel.send(`${guildName} is now unexpelled.`);
                } else {
                    return await message.channel.send(`${guildName} is not expelled.`);
                }
                break;

            case "LIST":
                let reportMessage = "**Expelled Guilds**\n```";
                lanisBot.database.all(`SELECT * FROM expelledGuilds`, async (err, rows) => {
                    let expelledGuilds = rows.map(row => row.name)

                    expelledGuilds.sort(compare);
                    let guildsScrolled = 1;
                    for (const guild of expelledGuilds) {
                        const newReportMessage = reportMessage + guild + "; ";
                        if (newReportMessage.length > 1996) {
                            reportMessage = reportMessage + "\n```";
                            await message.channel.send(reportMessage);
                            reportMessage = "```\n" + guild;
                        } else {
                            reportMessage = newReportMessage;
                            if (guildsScrolled === expelledGuilds.length) {
                                reportMessage = reportMessage + "\n```";
                            }
                        }
                        guildsScrolled += 1;
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
    name: "expelledGuilds",
    category: "Server Management",
    example: "`-expelledGuilds list` | `-expelledGuilds [remove / add] Name`",
    explanation: "Used for expelling guilds and to prevent any members from those guilds from verifying in the future."
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