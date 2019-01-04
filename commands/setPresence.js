const Discord = require("discord.js");

module.exports.run = async (lanisBot, message, args) => {
    if ((!message.member.hasPermission("ADMINISTRATOR")) && ((message.member.id !== "142250464656883713"))) return await message.channel.send("Only Admins or Lani can change the presence of the bot :)");

    const activityType = args[0];
    if (activityType) {
        if (activityType.toUpperCase() !== "PLAYING" && activityType.toUpperCase() !== "WATCHING" && activityType.toUpperCase() !== "STREAMING" && activityType.toUpperCase() !== "LISTENING") {
            return await message.channel.send("Input a correct activity type: `Playing` `Watching` `Streaming` or `Listening`");
        }
    } else {
        return await message.channel.send("Input the activity type: `Playing` `Watching` `Streaming` or `Listening`")
    }


    let activityName = "";

    for (i = 1; i < args.length; i++) {
        activityName = activityName + args[i] + " ";
    }
    if (activityName === "") return await message.channel.send("Please input an activity that the bot is doing.");
    await lanisBot.user.setActivity(activityName, { type: activityType.toUpperCase() })
    await message.channel.send("Presence changed.");

}

module.exports.help = {
    name: "setPresence",
    category: "Bot",
    example: "`-setPresence [Playing / Watching / Streaming / Listening] [What it does with that activity]`",
    explanation: "Used to set what the bot plays in the sidebar."
}