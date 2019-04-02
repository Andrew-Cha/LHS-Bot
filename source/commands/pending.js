const Roles = require("../../data/roles.json")

module.exports.run = async (client, message, args) => {
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

    let memberPending = false
    
    const actionUpperCase = action.toUpperCase();

    client.database.get(`SELECT * FROM pending WHERE name = '${input}' OR ID = '${input}'`, async (error, row) => {
        if (error) {
            throw error
        }
        if (row !== undefined) memberPending = true

        switch (actionUpperCase) {
            case "REMOVE":
                if (memberPending) {
                    client.database.run(`DELETE FROM pending WHERE name = '${input}' OR ID = '${input}'`)
                    await message.channel.send(`<@${row.ID}> (${row.name}) removed from the pending list.`);
                } else {
                    return await message.channel.send(`${unmodifiedInput} is not pending.`);
                }
                break;

            default:
                return await message.channel.send("Input a correct action, which is `remove`");
        }
    })
}

module.exports.help = {
    name: "pending",
    category: "Server Management",
    example: "`-pending list` | `-pending remove Name`",
    explanation: "A command used for removing people from the pending list, which the person usually in only while they have a verification to be checked."
}