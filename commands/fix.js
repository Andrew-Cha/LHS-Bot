const Roles = require("../dataFiles/roles.json")

module.exports.run = async (lanisBot, message, args) => {
    const securityRole = message.guild.roles.find(role => role.id === Roles.security.id);
    if (message.member.roles.highest.position < securityRole.position && !message.member.roles.find(role => role.id === Roles.verifier.id)) return await message.channel.send("You can not use this command as a non Security or Verifier.");
    const members = await message.guild.members.fetch();
    const verifiedRaiderRole = message.guild.roles.find(role => role.id === Roles.verifier.id);
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