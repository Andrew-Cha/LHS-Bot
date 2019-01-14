const Roles = require("../dataFiles/roles.json")

module.exports.run = async (lanisBot, message, args) => {
    const securityRole = message.guild.roles.find(role => role.id === Roles.security.id);
    if (message.member.roles.highest.position < securityRole.position && !message.member.roles.find(role => role.id === Roles.verifier.id)) return await message.channel.send("You can not use this command as a non Security or Verifier.");
    const action = args[0];
    if (action === undefined) return await message.channel.send("The only action is `remove`.")

    let unmodifiedInput = args[1]
    let input = args[1]
    if (input === undefined) return message.channel.send("Please input a user.")
    //Try to grab numbers only
    let inputReplaced = input.replace(/[^0-9]/g, '')
    if (inputReplaced === "") {
        if (input.length > 10) return message.channel.send("Usernames can't be longer than 10 characters.")
        input = input.toUpperCase()
    } else {
        if (inputReplaced.length < 17) return await message.channel.send("Input a user mention or their ID.")
        input = inputReplaced
    }

    if (input === undefined || input === null) return message.channel.send("Please input a user to remove from the pending list.");

    const actionUpperCase = action.toUpperCase();

    let memberVerified = false
    lanisBot.database.get(`SELECT * FROM verified WHERE name = '${input}' OR ID = '${input}'`, async (error, row) => {
        if (error) {
            throw error
        }
        if (row !== undefined) memberVerified = true

        switch (actionUpperCase) {
            case "REMOVE":
                if (memberVerified) {
                    lanisBot.database.run(`DELETE FROM verified WHERE name = '${input}' OR ID = '${input}'`)
                    await message.channel.send(`<@${row.ID}> (${row.name}) removed from the verified list.`);
                } else {
                    return await message.channel.send(`${unmodifiedInput} is not verified.`);
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