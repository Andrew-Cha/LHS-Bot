const Roles = require("../../data/roles.json")

module.exports.run = async (client, message, args) => {
    const securityRole = message.guild.roles.find(role => role.id === Roles.security.id);
    if (message.member.roles.highest.position < securityRole.position && !message.member.roles.find(role => role.id === Roles.verifier.id)) return await message.channel.send("You can not use this command as a non Security or Verifier.");
    const membersFetched = await message.guild.members.fetch();
    const members = Array.from(membersFetched.values());

    const allMembers = [];
    const foundMembers = [];
    for (const member of members) {
        if (!member.roles.find(role => role.id === Roles.verifiedRaider.id)) continue;
        const memberObject = {
            name: member.displayName,
            id: member.id
        }

        function findDuplicateName(name) {
            return function (member) {
                if (member.name.toUpperCase() === name.toUpperCase()) {
                    foundMembers.push(member);
                    foundMembers.push(memberObject);
                    let index = members.indexOf(member);
                    allMembers.slice(index);
                }
                return member.name === name;
            }
        }

        allMembers.find(findDuplicateName(memberObject.name));

        allMembers.push(memberObject);
    }
    
    for (const member of foundMembers) {
        await message.channel.send(`<@${member.id}>`);
    }

    await message.channel.send("Done finding duplicates.");
}

module.exports.help = {
    name: "duplicateMembers",
    category: "Server Management",
    example: "`-duplicateMembers`",
    explanation: "Attempts to find all people in a discord who seem to be in the server with more than 1 account."
}