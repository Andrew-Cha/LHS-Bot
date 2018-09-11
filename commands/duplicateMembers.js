const Discord = require("discord.js");
const channels = require("../dataFiles/channels.json");

module.exports.run = async (lanisBot, message, args) => {
    const fetchedGuild = await message.guild.fetchMembers();

    const members = fetchedGuild.members;
    const verifiedRaiderRole = message.guild.roles.find(role => role.name === "Verified Raider");
    let peopleCompared = 0;
    let peopleComparedMessage = await message.channel.send("Already compared " + peopleCompared + " people.");
    let duplicateMembersList = "These people are duplicates:\n";
    let peopleFoundList = [];
    for (const member of members.values()) {


        if (peopleCompared % 100 === 0) {
            await peopleComparedMessage.edit(("Already compared " + peopleCompared + " people."));
        }
        for (const member2 of members.values()) {
            if (!member.bot && member.roles.has(verifiedRaiderRole.id) && member2.roles.has(verifiedRaiderRole.id) && member.nickname !== null && member2.nickname !== null && member.id !== member2.id && peopleFoundList.includes(member.id) === false && peopleFoundList.includes(member2.id) === false) {
                if (member.nickname.toUpperCase() === member2.nickname.toUpperCase()) {
                    peopleFoundList.push(member.id);
                    peopleFoundList.push(member2.id);
                    const newDuplicateMembersList = duplicateMembersList + member + "; " + member2 + ";";
                    if (newDuplicateMembersList.length > 2000) {
                        await message.channel.send(duplicateMembersList);
                        duplicateMembersList = member + "; " + member2 + ";";
                    } else {
                        duplicateMembersList = newDuplicateMembersList;
                    }
                }
            }
        }
        peopleCompared += 1;
    }
    await message.channel.send(duplicateMembersList);
    await message.channel.send("Done");
    await peopleComparedMessage.delete();

}

module.exports.help = {
    name: "duplicateMembers"
}