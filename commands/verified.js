const Roles = require("../dataFiles/roles.json")

module.exports.run = async (lanisBot, message, args) => {
    const securityRole = message.guild.roles.find(role => role.id === Roles.security.id);
    if (message.member.roles.highest.position < securityRole.position && !message.member.roles.find(role => role.id === Roles.verifier.id)) return await message.channel.send("You can not use this command as a non Security or Verifier.");
    const action = args[0];
    if (action === undefined) return await message.channel.send("The only action is `remove`.")
    const playerName = args[1]
    if (playerName === undefined) return message.channel.send("Please input a user to remove from the verified list.");
    if (playerName) {
        if (playerName.length > 10) return message.channel.send("Nicknames can't be longer than 10 characters long.");
    }

    let memberVerified = false
    const playerNameUppercased = playerName !== undefined ? playerName.toUpperCase() : ""
    const actionUpperCase = action.toUpperCase();

    lanisBot.database.get(`SELECT * FROM verified WHERE name = '${playerNameUppercased}'`, async (error, row) => {
        if (error) {
            throw error
        }
        if (row !== undefined) memberVerified = true

        switch (actionUpperCase) {
            case "REMOVE":
                if (memberVerified) {
                    lanisBot.database.run(`DELETE FROM verified WHERE name = '${playerNameUppercased}'`)
                    await message.channel.send(`${playerName} removed from the verified list.`);
                } else {
                    return await message.channel.send(`${playerName} is not verified.`);
                }
                break;

            default:
                return await message.channel.send("Input a correct action, which is `remove`");
        }
    })
}

module.exports.help = {
    name: "verified",
    category: "Server Management",
    example: "`-verified remove Name`",
    explanation: "Used to remove people from the verified list if they ever avoided a suspension."
}