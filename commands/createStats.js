const Discord = require("discord.js");

module.exports.run = async (lanisBot, message, args) => {
    //lanisBot.database.run('CREATE TABLE stats(ID varchar NOT NULL, lostHallsKeysPopped INT, otherKeysPopped INT, cultsDone INT, voidsDone INT, otherDungeonsDone INT, cultsLed INT, voidsLed INT, assists INT, vialsStored INT, vialsUsed INT, commendations INT, unique(ID));')
    let members = await message.guild.members.fetch()

    let totalInserts = 0
    let totalChecks = 0
    members.each(member => {
        totalChecks += 1
        console.log("Total Checks: " + totalChecks + " / " + members.size)
        lanisBot.database.get(`SELECT * FROM stats WHERE ID = '${member.id}'`, async (error, row) => {
            if (error) {
                throw error
            }

            if (row === undefined) {
                totalInserts++
                console.log("Added member " + member.id)
                lanisBot.database.run(`INSERT INTO stats(ID, lostHallsKeysPopped, otherKeysPopped, cultsDone, voidsDone, otherDungeonsDone, cultsLed, voidsLed, assists, currentCultsLed, currentVoidsLed, currentAssists, vialsStored, vialsUsed, commendations) VALUES(${member.id}, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)`)
                console.log("Total Inserts:" + totalInserts)
            }
        })
    })

    return
}

module.exports.help = {
    name: "createStats",
    category: "Bot",
    example: "`-createStats`",
    explanation: "Puts all the members in the discord that are not in the `stats` database table into it."
}
