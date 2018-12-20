const path = require('path');
const playersExpelledFile = path.normalize(__dirname + "../../dataFiles/expelledPeople.json");
const playersExpelled = require(playersExpelledFile); //1 Expelled
const suspensionsFile = path.normalize(__dirname + "../../dataFiles/suspensions.json");
const suspensions = require(suspensionsFile); //Suspensions
const verifiedPath = path.normalize(__dirname + "../../dataFiles/verifiedPeople.json");
const verified = require(verifiedPath); //Verified

module.exports.run = async (lanisBot, message, args) => {
    if (message.member.id !== "142250464656883713") return message.channel.send("Only <@142250464656883713> can access the database directly.");
    await message.channel.send("Starting.")
    lanisBot.database.serialize(() => {
        for (let suspension in suspensions) {
            const roles = suspensions[suspension].roles.join(",")
            lanisBot.database.run(`INSERT OR REPLACE INTO suspended(ID, time, roles) VALUES('${suspension}','${suspensions[suspension].time}', '${roles}')`)
        }

        for (let verifiedPerson in verified.members) {
            lanisBot.database.run(`INSERT OR REPLACE INTO verified(ID, name) VALUES('${verified.members[verifiedPerson].id}', '${verified.members[verifiedPerson].name}')`)
        }

        for (let expelled in playersExpelled.members) {
            lanisBot.database.run(`INSERT OR REPLACE INTO expelled(name) VALUES('${playersExpelled.members[expelled].name}')`)
        }
    })

    await message.channel.send("Data transferred.")
}

module.exports.help = {
    name: "db"
}