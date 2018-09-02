const Discord = require("discord.js");
const channels = require("../dataFiles/channels.json");

module.exports.run = async (lanisBot, message, args) => {
    const faqChannel = lanisBot.channels.get(channels.faq);

    let faqMessage = new Discord.RichEmbed()
        .setAuthor("Frequently Asked Questions")
        .addField("Q: Why can't I see raids?", "A: You probably are not verified yet. Check <#343711922417434634> and follow the bot's instructions in <#471711348095713281>.")
        .addBlankField()
        .addField("Q: How do I know if I'm verified?", "A: The bot will message you when you are verified. You will also see a list of new channels and have a different color name. If you click your name you will see all your roles as well.")
        .addBlankField()
        .addField("Q: I am try to verify but the bot is sending me messages with nothing attached.", "A: Your personal settings are set to hide linked previews. Follow the diagram bellow to turn it back on. (Keep this setting on otherwise you won’t see bot instructions in <#379779029479194624>)\n[Visual tutorial how to turn it on](https://cdn.discordapp.com/attachments/471376992193740800/482399125334392852/0ero.png)")
        .addBlankField()
        .addField("Q: How do I join organized raids once I am verified?", "A: Raids will be announced in <#379779029479194624>.  Join one of the queues bellow #suspend-log and react to the bot with <:cultist:397924622928052230>, <:LHvoid:431284547012001809>, or one of the classes you are bringing, listed in the reactions.")
        .addBlankField()
        .addField("Q: How do I know where to go for the Lost Halls?", "A: You must first be verified. Once you are verified follow the instructions bellow\n1. Enter Queue voice chat(You won’t get moved if you’re not in queue)\n2. Wait to get pinged in <#379779029479194624> and hope its an AFK Check\n3. You MUST click on either <:cultist:397924622928052230> or <:LHvoid:431284547012001809> to get moved (Reacting with your class will move you as well)\n4. Wait to get moved.\n5. Whenever you’re inside the raiding channel, wait for the leaders to prepare the run.\n6. Whenever they are ready, the leaders will start a countdown to say the server. \n7. The Leader will say the server location and bazaar multiple times into the voice chat.\n:warning: You won't get moved in if you're deafened.")
        .addBlankField()
        .addField("Q: I see we use voice channels on this server, do I have to speak?", "A: No, only Raid Leaders speak in the voice channels. All other members are muted by default. You only have to listen.")
        .addBlankField()
        .addField("Q: Is the run a cult or void run?", "A: When the bot posts to begin a run it will say at the top “Cult AFK Check” (with a red border) or “Void AFK Check” (with a purple border)")
        .addBlankField()
        .addField("Q: I am interested in becoming a Raid Leader, what do I do?", "A: Our Applications can be found here. Read carefully :)\n[Application Link](https://docs.google.com/forms/d/e/1FAIpQLScEce9thYxQb-4eflqc3cmFzYIgAOmdFYDjWcB5VLiPeurAxQ/viewform)")
        .addBlankField()
        .addField("Q: I applied for staff on this Discord and never heard anything back.", "A: We receive many applications and cannot reply to each one. Please understand we only ever approach you if you’re hired.")
        .setColor("3ea04a")
    await faqChannel.send(faqMessage);

}

module.exports.help = {
    name: "faqReset"
}