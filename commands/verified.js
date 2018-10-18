const fs = require('fs');
const path = require('path');
const Roles = require("../dataFiles/roles.json")
const verifiedPath = path.normalize(__dirname + "../../dataFiles/verifiedPeople.json");
const verified = require(verifiedPath);

module.exports.run = async (lanisBot, message, args) => {
    const securityRole = message.guild.roles.find(role => role.id === Roles.security.id);
    if (message.member.roles.highest.position < securityRole.position && !message.member.roles.find(role => role.id === Roles.verifier.id)) return await message.channel.send("You can not use this command as a non Security or Verifier.");
    const action = args[0];
    if (action === undefined) return await message.channel.send("The only action is `remove`.")
    const playerInputted = args[1]
    if (playerInputted === undefined) return message.channel.send("Please input a user to remove from the verified list.");

    const actionUpperCase = action.toUpperCase();

    let index;
    let memberVerified = false;
    for (let i = 0; i < verified.members.length; i++) {
        if (verified.members[i].name.toUpperCase() === playerInputted.toUpperCase()) {
            memberVerified = true;
            index = i;
            break;
        }
    }

    switch (actionUpperCase) {
        case "REMOVE":
            if (memberVerified) {
                verified.members.splice(index, 1);
                await fs.writeFile(verifiedPath, JSON.stringify(verified), function (e) {
                    if (err) return console.log(e);
                });
                await message.channel.send("Player removed from the verified list.");
            } else {
                return await message.channel.send("This member is not verified.");
            }
            break;

        default:
            return await message.channel.send("Input a correct action, which is `remove`");
            break;
    }
}

module.exports.help = {
    name: "verified"
}