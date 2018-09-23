const Discord = require("discord.js");
const channels = require("../dataFiles/channels.json");

module.exports.run = async (lanisBot, message, args) => {
    const securityRole = message.guild.roles.find(role => role.name === "Security");
    if (message.member.roles.highest.position < securityRole.position && !message.member.roles.find(role => role.name === "Verifier")) return await message.channel.send("You can not use this command as a non Security or Verifier.");
    const membersFetched = await message.guild.members.fetch();
    const membersFetchedSize = membersFetched.size;
    const members = Array.from(membersFetched.values());
    for (let i = 0; i < membersFetchedSize; i++) {
        const currentMember = members[i];
        if (currentMember.bot) {
            members.splice(i, 1)
            i--;
        }
    }

    const verifiedRaiderRole = message.guild.roles.find(role => role.name === "Verified Raider");
    let peopleCompared = 0;
    let peopleComparedMessage = await message.channel.send("Already compared " + peopleCompared + " people.");
    let duplicateMembersList = "These people are duplicates:\n";
    let peopleFoundList = [];
    for (let firstMemberIndex = 0; firstMemberIndex < membersFetchedSize; firstMemberIndex++) {
        const member = members[firstMemberIndex]

        if (peopleCompared % 100 === 0) {
            await peopleComparedMessage.edit(("Already compared " + peopleCompared + " people."));
        }
        for (let secondMemberIndex = 1; secondMemberIndex < membersFetchedSize; secondMemberIndex++) {
            const member2 = members[secondMemberIndex]
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