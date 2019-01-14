const Discord = require("discord.js");

module.exports.run = async (lanisBot, message, args) => {
        console.log("Dropped")
        lanisBot.database.run('ALTER TABLE stats ADD commendedBy varchar')
        console.log("Created")
    return
}

module.exports.help = {
    name: "createStatsTable",
    category: "Bot",
    example: "`-createStatsTable`",
    explanation: "Puts all the members in the discord that are not in the `stats` database table into it."
}
