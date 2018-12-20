const Roles = require("../dataFiles/roles.json")

module.exports.run = async (lanisBot, message, args) => {
    const securityRole = message.guild.roles.find(role => role.id === Roles.security.id);
    if (message.member.roles.highest.position < securityRole.position && !message.member.roles.find(role => role.id === Roles.verifier.id)) return await message.channel.send("You can not use this command as a non Security or Verifier.");
    const action = args[0];
    if (action === undefined) return await message.channel.send("The only action is `remove`.")
    const playerName = args[1]
    if (playerName === undefined) return message.channel.send("Please input a user to remove from the pending list.");
    if (playerName) {
        if (playerName.length > 10) return message.channel.send("Nicknames can't be longer than 10 characters long.");
    }

    let memberPending = false
    const playerNameUppercased = playerName !== undefined ? playerName.toUpperCase() : ""
    const actionUpperCase = action.toUpperCase();

    lanisBot.database.get(`SELECT * FROM pending WHERE name = '${playerNameUppercased}'`, async (error, row) => {
        if (error) {
            throw error
        }
        if (row !== undefined) memberPending = true

        switch (actionUpperCase) {
            case "REMOVE":
                if (memberPending) {
                    lanisBot.database.run(`DELETE FROM pending WHERE name = '${playerNameUppercased}'`)
                    await message.channel.send(`${playerName} removed from the pending list.`);
                } else {
                    return await message.channel.send(`${playerName} is not pending.`);
                }
                break;

            default:
                return await message.channel.send("Input a correct action, which is `remove`");
        }
    })
}

module.exports.help = {
    name: "pending"
}