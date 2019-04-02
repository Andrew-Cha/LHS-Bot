const Roles = require("../../data/roles.json")

module.exports.run = async (client, message, args) => {
    const devRole = message.guild.roles.find(role => role.id === Roles.developer.id);
    if (message.member.roles.highest.position < devRole.position) return;
    let channelName;
    let channel;

    if (typeof args[0] === 'string') {
        channelName = args[0]
        channel = message.guild.channels.find(channel => channel.name.toUpperCase() === channelName.toUpperCase() && channel.guild.id === message.guild.id)
    }

    if (channel === undefined) {
        const channelTag = args[0]
        let channelID = channelTag.match(/\d/g)
        channelID = channelID.join("")
        channel = message.guild.channels.get(channelID)
    }

    let blacklistWord = "";

    for (i = 1; i < args.length - 1; i++) {
        if (i !== args.length - 1) {
            blacklistWord = blacklistWord + args[i] + " ";
        } else {
            blacklistWord = blacklistWord + args[i]
        }
    }

    let messageLimit = args[args.length - 1]
    if (args.length < 3) return await message.channel.send("Please input a message limit.");
    if (channel === undefined) return await message.channel.send("Can't find that channel.")
    if (blacklistWord === undefined || blacklistWord === "") return await message.channel.send("Input a blacklist word.")
    if (isNaN(messageLimit)) return await message.channel.send("Please input a message limit.");
    let messages = await channel.messages.fetch()
    let deleted = 0;
    let index = 0;

    let progressString = "So far deleted " + deleted + " messages."
    const progressMessage = await message.channel.send(progressString)

    const updateMessagesDeleted = setInterval(() => {
        progressMessage.edit("So far deleted " + deleted + " messages.");
    }, 30000);

    const blackListWordUpperCase = blacklistWord.toUpperCase()
    await checkList(messages);

    async function checkList(messagesPassed) {
        for (const message of messagesPassed.values()) {
            const contentUpperCase = message.content.toUpperCase()
            if (contentUpperCase.includes(blackListWordUpperCase)) {
                await message.delete()
                deleted++
            }
            index++
            console.log(index)
            if (index % 50 === 0 && index < messageLimit) {
                const lastID = messages.last().id
                messages = await channel.messages.fetch({ before: lastID})
                await checkList(messages)
            }
        }
    }


    clearInterval(updateMessagesDeleted);
    await progressMessage.delete();
    await message.channel.send("Purge for the channel " + channel.toString() + " for the word **" + blacklistWord + "** is done.\nTotal Messages Deleted: " + deleted)
}

module.exports.help = {
    name: "purgeChannel",
    category: "Server Management",
    example: "`-purgeChannel [Name / Channel Tag] [Phrase To Delete] [How many messages to check, counting from the newest page]`",
    explanation: "Meant to be used for removing a specified phrase from a specified channel."
}
