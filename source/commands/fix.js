const Roles = require("../../data/roles.json")

module.exports.run = async (client, message, args) => {
    const securityRole = message.guild.roles.find(role => role.id === Roles.security.id);
    if (message.member.roles.highest.position < securityRole.position && !message.member.roles.find(role => role.id === Roles.verifier.id)) return await message.channel.send("You can not use this command as a non Security or Verifier.");
    const members = await message.guild.members.fetch();
    let peopleWithoutNickname = [];
    for (const member of members.values()) {
        if (!member.bot && member.roles.has(Roles.verifiedRaider.id) && member.nickname === null) {
            peopleWithoutNickname.push(member);
        }
    }


    let currentMessage = "";
    await message.channel.send("No nicknames (" + peopleWithoutNickname.length + " people)" + ":\n" + peopleWithoutNickname.join("\n"));

}

module.exports.help = {
    name: "noNicknames",
    category: "Server Management",
    example: "`-noNicknames`",
    explanation: `Finds all the people in the server with the <@${Roles.verifiedRaider.id}> role and no nickname.`
}