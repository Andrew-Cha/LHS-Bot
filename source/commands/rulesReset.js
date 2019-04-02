const Discord = require("discord.js");

const Channels = require("../../data/channels.json");
const Roles = require("../../data/roles.json")

module.exports.run = async (client, message, args) => {
    const securityRole = message.guild.roles.find(role => role.id === Roles.security.id);
    if (message.member.roles.highest.position < securityRole.position && !message.member.roles.find(role => role.id === Roles.verifier.id)) return await message.channel.send("You can not use this command as a non Security or Verifier.");
    const rulesChannel = client.channels.get(Channels.rules.id);
    await rulesChannel.messages.fetch().then(async messages => {
        for (const message of messages.values()) {
            await message.delete();
        }
    });
    let rulesMessage = new Discord.MessageEmbed()
        .setDescription("Discord Rules")
        .addField("#1", "Inappropriate language (excessive swears, racial slurs, deliberate attempts to instigate negative reactions, threats of harm or self-harm, etc) will be removed and the User(s) in question will be given a warning, mute, kicked or banned depending on severity.")
        .addBlankField()
        .addField("#2", "Mentioning any of the above in a joking manor still counts. Exploiting loopholes in our rules such as saying “commit aliven’t” instead of “kys” will get you muted. If it is genuinely friendly/joking, take it to DMs with your peer.")
        .addBlankField()
        .addField("#3", "Use each channel for its intended purpose, small sidetracking is allowed if a topic leads to it. (Check pins or channel topics, rules in channel topics are just as valid as these), do not spam chats and don't spell out inappropriate/unnecessary words using reactions. (Rules 1, 2 & 3) apply here as well.")
        .addBlankField()
        .addField("#4","Remember to be respectful and kind to all members, do not actively troll! This includes staff if there is an issue and staff addresses it, abide accordingly. Ping staff only if necessary. Unnecessary pings will get you muted. A history of issues will lead to perma-mute.")
        .addBlankField()
        .addField("#5", "There is no NSFW content in this Discord server, please don't post any yourself. Posting any NSFW content will result in a mute or even a ban.")
        .addBlankField()
        .addField("#6", "Staff impersonation is highly against the rules and will get you permanently banned.")
        .addBlankField()
        .addField("#7", "No RWT/RMT (real money trading); no third party gambling sites or other gambling, no private servers or soliciting to discord users.")
        .addBlankField()
        .addField("#8", "Don't antagonize or steal from other LH discords. Don't discuss other LH discords here or any Discords that are similar to our <#436351270346031124>. Don't leak any locations of any discord server. \n")
        .addBlankField()
        .addField("#9", "NO Hackusating or discussion of hacks, do **not** promote them. We hold a neutral position on hacking. If you have an issue concerning a member using hacks/exploits; take it to Deca Support:\n[Deca Support Link](https://decagames.desk.com/customer/portal/emails/new)")
        .addBlankField()
        .addField("#10", "Abusing our bot will get you banned. Please do not apply too frequently or attempt to dodge a suspension by leaving and rejoining the server, you will get banned. (The bot keeps track for us)\n\nInfractions on any of the above rules will have you muted or banned depending on the severity. Moderating roles have the last word, do not appeal to multiple staff members. If you have an issue with their decision message an <@&343709010832261121>.")
        .addBlankField()
        .addField(" ឵឵ ឵឵","**Most importantly** do **not** break Discord ToS, we stand by it. This includes any form of targeted harassment, hate speech or illegal activities.\nRead more about it in the [Official Discord ToS Page](https://discordapp.com/terms)")
        .setColor("3ea04a")
    await rulesChannel.send(rulesMessage);

}

module.exports.help = {
    name: "rulesReset",
    category: "Server Management",
    example: "`-rulesReset`",
    explanation: "Used to reset the embed in the rules channel."
}