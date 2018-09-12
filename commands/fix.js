const Discord = require("discord.js");
const channels = require("../dataFiles/channels.json");

module.exports.run = async (lanisBot, message, args) => {
    const fetchedGuild = await message.guild.members.fetch();

    const members = fetchedGuild.members;
    const verifiedRaiderRole = message.guild.roles.find(role => role.name === "Verified Raider");
    let peopleWithoutNickname = [];
    for (const member of members.values()) {
        if (!member.bot && member.roles.has(verifiedRaiderRole.id) && member.nickname === null) {
            peopleWithoutNickname.push(member);
        }
    }


    let currentMessage = "";
    await message.channel.send("No nicknames (" + peopleWithoutNickname.length + " people)" + ":\n" + peopleWithoutNickname.join("\n"));

}

module.exports.help = {
    name: "fix"
}