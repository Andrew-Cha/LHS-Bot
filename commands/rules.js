const Discord = require("discord.js");
const channels = require("../dataFiles/channels.json");

module.exports.run = async (lanisBot, message, args) => {
    const rulesChannel = lanisBot.channels.get(channels.rules);

    let rulesMessage = new Discord.MessageEmbed()
        .addField("Discord Rules", "1) Inappropriate language (excessive swears, racial slurs, deliberate attempts to instigate negative reactions, threats of harm or self-harm, etc) will be removed and the User(s) in question will be given a warning, mute, kicked or banned depending on severity.\n\n2) Mentioning any of the above in a joking manor still counts. Exploiting loopholes in our rules such as saying “commit aliven’t” instead of “kys” will get you muted. If it is genuinely friendly/joking, take it to DMs with your peer.\n\n3) Use each channel for its intended purpose, small sidetracking is allowed if a topic leads to it. (Check pins or channel topics, rules in channel topics are just as valid as these), do not spam chats and don't spell out inappropriate/unnecessary words using reactions. (Rules 1, 2 & 3) apply here as well.\n")
        .addField(" ឵឵ ឵឵","4) Remember to be respectful and kind to all members! This includes staff if there is an issue and staff addresses it, abide accordingly. Ping staff only if necessary. Unnecessary pings will get you muted. A history of issues will lead to perma-mute.\n")
        .addField(" ឵឵ ឵឵", "5) NSFW content goes into <#477670781443375134> tab and follow Discord TOS - nothing underage, violent, or otherwise illegal. (If you are interested in achieving a role with access to these channels pm <@297435165670637569>\n\n6) Staff impersonation is highly against the rules and will get you permanently banned. \n")
        .addField(" ឵឵ ឵឵", "7) No RWT/RMT (real money trading); no third party gambling sites or other gambling, no private servers or soliciting to discord users.\n\n8) Don't antagonize or steal from other LH discords. Don't discuss other LH discords here. \n")
        .addField(" ឵឵ ឵឵","9) NO Hackusating or discussion of hacks. We hold a neutral position on hacking. If you have an issue concerning a member using hacks/exploits; take it to Deca Support:\n[Deca Support Link](https://decagames.desk.com/customer/portal/emails/new)\n\n10) Abusing our verification bot will get you banned. Please do not apply too frequently or attempt to dodge a suspension by leaving and rejoining the server, you will get banned. (The bot keeps track for us)\n\nInfractions on any of the above rules will have you muted or banned depending on the severity. Moderating roles have the last word, do not appeal to multiple staff members. If you have an issue with their decision message an <@&343709010832261121>.")
        .setColor("3ea04a")
    await rulesChannel.send(rulesMessage);

}

module.exports.help = {
    name: "rulesReset"
}