const Roles = require("../dataFiles/roles.json")
const fs = require('fs');
const path = require('path');
const currentlyVerifyingFile = path.normalize(__dirname + "../../dataFiles/currentlyVerifying.json");
const currentlyVerifying = require(currentlyVerifyingFile);

module.exports.run = async (lanisBot, message, args) => {
    const securityRole = message.guild.roles.find(role => role.id === Roles.security.id);
    if (message.member.roles.highest.position < securityRole.position && !message.member.roles.find(role => role.id === Roles.verifier.id)) return await message.channel.send("You can not use this command as a non Security or Verifier.");
    const action = args[0];
    if (action === undefined) return await message.channel.send("The only action is `remove`.")
    const playerInputted = args[1]
    if (playerInputted === undefined) return message.channel.send("Please input a user to remove from the pending list.");

    const actionUpperCase = action.toUpperCase();

    let index;
    let memberVerifying = false;
    for (let i = 0; i < currentlyVerifying.members.length; i++) {
        if (currentlyVerifying.members[i].name.toUpperCase() === playerInputted.toUpperCase()) {
            memberVerifying = true;
            index = i;
            break;
        }
    }

    switch (actionUpperCase) {
        case "REMOVE":
            if (memberVerifying) {
                currentlyVerifying.members.splice(index, 1);
                await fs.writeFile(currentlyVerifyingFile, JSON.stringify(currentlyVerifying), function (e) {
                    if (err) return console.log(e);
                });
                await message.channel.send("Player's application removed.");
            } else {
                return await message.channel.send("This member does not have a pending application.");
            }
            break;

        default:
            return await message.channel.send("Input a correct action, which is `remove`");
            break;
    }
}

module.exports.help = {
    name: "pending"
}