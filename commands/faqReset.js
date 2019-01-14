const Discord = require("discord.js");
const Roles = require("../dataFiles/roles.json")
const Channels = require("../dataFiles/channels.json");

module.exports.run = async (lanisBot, message, args) => {
    const securityRole = message.guild.roles.find(role => role.id === Roles.security.id);
    if (message.member.roles.highest.position < securityRole.position && !message.member.roles.find(role => role.id === Roles.verifier.id)) return await message.channel.send("You can not use this command as a non Security or Verifier.");
    const faqChannel = lanisBot.channels.get(Channels.faq.id);

    await faqChannel.messages.fetch().then(async messages => {
        for (const message of messages.values()) {
            await message.delete();
        }
    });

    let faqMessage = new Discord.MessageEmbed()
        .setAuthor("Frequently Asked Questions")
        .addField("Q: Why can't I see raids?", "A: You probably are not verified yet. Check <#343711922417434634> and follow the bot's instructions in <#471711348095713281>.")
        .addBlankField()
        .addField("Q: How do I know if I'm verified?", "A: The bot will message you when you are verified. You will also see a list of new channels and have a different color name. If you click your name you will see all your roles as well.")
        .addBlankField()
        .addField("Q: How do I join organized raids once I am verified?", "A: Raids will be announced in <#379779029479194624>.  Join a raiding channel that is active (It is specified in the AFK Check and has its name highlighted) and react to the bot with <:lostHallsCultist:506091048469004291> , <:lostHallsVoidEntity:506091097970442257>, or one of the classes you are bringing, listed in the reactions. For event dungeons react with the appropriate portal image.\nIf you want to bring a key or a vial - react to those emojis alongside the aformentioned ones.\n[Video showing how to join raids](https://www.youtube.com/watch?v=SriTPHKNFH4&feature=youtu.be)")
        .addBlankField()
        .addField("Q: Why don't I see any 'emojis' under the AFK check?", "You have them turned off in your Discord settings, please turn them on under Settings -> Text & Images -> Show emoji reactions on messages. (Yes)")
        .addBlankField()
        .addField("Q: I see we use voice channels on this server, do I have to speak?", "A: No, only Raid Leaders speak in the voice channels. All other members are muted by default. You only have to listen.")
        .addBlankField()
        .addField("Q: Is the run a cult or void run?", "A: When the bot posts to begin a run it will say at the top “Cult AFK Check” (with a red border) or “Void AFK Check” (with a purple border)")
        .addBlankField()
        .addField("Q: Can I bring any classes?", "Yes, even though there are only 4 reactions for 4 classes, those are only used as an indicator of what classes need to be brought for the run to be smooth.")
        .addBlankField()
        //.addField("Q: I am interested in becoming a Raid Leader, what do I do?", "A: Applications are closed for the time being, an announcement will be made when its apps reopen")
        .addField("Q: I am interested in becoming a Raid Leader, what do I do?", "A: Our Applications can be found here. Read carefully :)\n[Raid Leader Application Link](https://docs.google.com/forms/d/e/1FAIpQLScEce9thYxQb-4eflqc3cmFzYIgAOmdFYDjWcB5VLiPeurAxQ/viewform)\n[Security Application Link](https://docs.google.com/forms/d/e/1FAIpQLSezz_i2wr_t0ZCLAvobMSPd3fyFKboswRci1fDsZeP5fOlF7A/viewform?entry.214030654&entry.632711387&entry.198421798&entry.605252013&entry.1569336665&entry.932058305&entry.1858288425)")
        .addBlankField()
        .addField("Q: I am expelled permanently and want to appeal my suspension, what do I do?", "Message us at <#526466244333797408>, keep it concise please.")
        .addBlankField()
        .addField("Q: I applied for staff on this Discord and never heard anything back.", "A: We receive many applications and cannot reply to each one. Please understand we only ever approach you if you’re hired.")
        .addBlankField()
        .addField("Who owns and creates the bot?", "If you need any help or have something to tell me, my name is <@142250464656883713>")
        .addBlankField()
        .addField("Q: Invite Code?", "Here you go:\nhttps://discord.gg/Ntzh472")
        .setColor("3ea04a")
    await faqChannel.send(faqMessage);
    await faqChannel.send("**Q: I am trying to <#471711348095713281> / read <#482394590721212416> or <#482368517568462868> but I see messages with nothing attached**\nA: Your personal settings are set to hide linked previews. Follow the diagram bellow to turn it back on. (Keep this setting on otherwise you won’t see bot instructions in <#379779029479194624>)\nVisual tutorial on how to turn it on:\nhttps://cdn.discordapp.com/attachments/471376992193740800/482399125334392852/0ero.png");

}

module.exports.help = {
    name: "faqReset",
    category: "Server Management",
    example: "`-faqReset`",
    explanation: "Meant to be used to reset the message in the FAQ channel."
}