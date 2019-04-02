const Discord = require("discord.js");
const Channels = require("../../data/channels.json");
const Roles = require("../../data/roles.json")

module.exports.run = async (client, message, args) => {
    const securityRole = message.guild.roles.find(role => role.id === Roles.security.id)
    const raiderRole = message.guild.roles.find(role => role.id === Roles.verifiedRaider.id)
    if (message.member.roles.highest.position < securityRole.position && !message.member.roles.find(role => role.id === Roles.verifier.id)) return await message.channel.send("You can not use this command as a non Security or Verifier.");
    const memberToVerify = message.mentions.members.last()
    let inGameName = args[1]
    let noPerms = false

    const errorChannel = client.channels.get(Channels.verificationAttempts.id)
    const verificationLogs = client.channels.get(Channels.verificationsLog.id)

    if (inGameName === memberToVerify.user.username) {
        let capitalizedMemberToVerify = capitalizeFirstLetter(inGameName);
        if (capitalizedMemberToVerify !== memberToVerify.user.username) {
            inGameName = capitalizedMemberToVerify;
        } else {
            let lowerCaseMemberToVerify = lowerCaseFirstLetter(inGameName);
            inGameName = lowerCaseMemberToVerify;
        }
    }

    await memberToVerify.setNickname(inGameName, "Accepted into the server via Manual Verification via the command.").catch(async e => {
        noPerms = true;
    });
    await memberToVerify.roles.add(raiderRole, "Accepted into the server via Manual Verification via the command.").catch(async e => {
        noPerms = true;
    });

    if (noPerms) return message.channel.send("Input a correct user mention or the bot had no permissions to set their nickname.");

    let successfulVerificationEmbed = new Discord.MessageEmbed()
        .setFooter("User ID: " + message.member.id)
        .setColor("3ea04a")
        .addField("Successful Verification ", "User " + message.member.toString() + " (" + message.author.username + ") got manually verified by " + message.member.toString() + ".");

    await errorChannel.send(successfulVerificationEmbed);
    await memberToVerify.send("Verification is successful, welcome to Public Lost Halls!\nWe're pleased to have you here. Before you start, we do expect all of our user to check our rules and guidelines, found in <#482368517568462868> (Apply both in discord and in-game) and <#379504881213374475> (Which only apply in game). Not knowing these rules or not reading them will not be an excuse for further suspensions, so if you can't understand anything, please don't be afraid asking staff members or members of the community.\n\nWe also have a quick start guide, which can be found in <#482394590721212416>, regarding how to join runs properly, finding the invite link for the server, and where the Raid Leader applications are.\n\nAny doubts, don't be afraid to ask any Staff member to clarify any doubts you may have.");
    let successfulVerificationLogEmbed = new Discord.MessageEmbed()
        .setFooter("User ID: " + message.member.id)
        .setColor("3ea04a")
        .addField("Successful Verification", message.member.toString() + " has manually verified a member " + memberToVerify.toString() + " with the in game name of '" + inGameName + "'\n[Player Profile](https://www.realmeye.com/player/" + inGameName + ")");
    await verificationLogs.send(successfulVerificationLogEmbed);

    client.database.get(`SELECT * FROM verified WHERE name = '${inGameName.toUpperCase()}' OR ID = '${memberToVerify.id}'`, async (error, row) => {
        if (error) {
            throw error
        }
        if (row === undefined) {
            client.database.run(`INSERT INTO verified(ID, name) VALUES('${memberToVerify.id}', '${inGameName.toUpperCase()}')`)
        }
    })
}

module.exports.help = {
    name: "manualVerify",
    category: "Server Management",
    example: "`-manualVerify [User Mention] [Their IGN]`",
    explanation: "Manually verifies a person by skipping the whole verification process."
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function lowerCaseFirstLetter(string) {
    return string.charAt(0).toLowerCase() + string.slice(1);
}