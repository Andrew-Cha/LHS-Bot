const Discord = require("discord.js");

module.exports.run = async (lanisBot, message, args) => {
    const commandListUncapitalized = ["AFK", "all", "clean", "currentWeek", "dice", "duplicateMembers", "endWeek", "expelled", "expelledGuilds", "faqReset", "fix", "hello", "log", "parseMembers", "restart", "restartVeri", "rulesReset", "safeGuard", "say", "setPresence", "splitVoid", "suspend", "unsuspend", "verify"]
    const commandList = ["AFK", "ALL", "CLEAN", "CURRENTWEEK", "DICE", "ENDWEEK", "EXPELLED", "EXPELLEDGUILDS", "FAQRESET", "FIX", "HELLO", "LOG", "PARSEMEMBERS", "PENDING", "RESTART", "RESTARTVERI", "RULESRESET", "SAFEGUARD", "SETPRESENCE", "SPLITVOID", "SUSPEND", "UNSUSPEND", "VERIFIED", "VERIFY"];
    let command;
    if (args.length > 0) {
        command = args[0].toUpperCase();
    } else {
        command = "ALL";
    }

    let commandDescription = new Discord.MessageEmbed()
        .setColor("#5042f4")
        .setFooter("⚠ Capitalization when issuing commands doesn't matter.");

    switch (command) {
        case ("AFK"):
            commandDescription.addField("AFK Check", "Begins an AFK check. Has two types `cult` and `void`, if started with a location it will be messaged to the reactees.\n\nUsage:\n`-afk [Raiding Voice Channel Number] [Type - Void / Cult] (Location - Optional)`");
            break;

        case ("ALL"):
            commandDescription.addField("Server Managment", "Commands, DuplicateMembers, Expelled, ExpelledGuilds, FaqReset, Fix, Pending, RestartVeri, RulesReset, Suspend, Unsuspend, Verify.");
            commandDescription.addField("Raiding Tools", "AFK, Clean, CurrentWeek, EndWeek, Log, ParseMembers, SafeGuard, SplitVoid");
            commandDescription.addField("Miscellaneous", "Dice, Hello, Say, SetPresence");
            commandDescription.addBlankField();
            commandDescription.addField("Command Search:", "To find out more about a command, type `-commands [Command Name]`");
            break;

        case ("CLEAN"):
            commandDescription.addField("Clean", "Moves all members out of a voice channel to queue, has an option to abort the moving.\n\nUsage:\n`-clean [Raiding Voice Channel Number]`");
            break;

        case ("CURRENTWEEK"):
            commandDescription.addField("Current Week's Run Logs", "Displays the current week's run logs. Pings the command issuer.\n\nUsage:\n`-currentWeek`");
            break;

        case ("COMMANDS"):
            commandDescription.addField("Commands", "Displays all the commands.\n\nUsage:\n`-commands` or `-commands all`");
            break;

        case ("DICE"):
            commandDescription.addField("Dice", "Rolls a dice and returns a random result from 1 to 20 in a stylized way.\n\nUsage:\n`-dice`");
            break;

        case ("DUPLICATEMEMBERS"):
            commandDescription.addField("Duplicate Members", "Finds all members with duplicate nicknames in the server. Very slow and bad, takes around 15 min. Please only use if really needed and if there are no raids.\n\nUsage:\n`-duplicateMembers`");
            break;

        case ("ENDWEEK"):
            commandDescription.addField("End Week", "A command that clears all recorded runs and logs them in <#446916716455395328>, only usable by RLC and higher or Lanis.\n\nUsage:\n`-endWeek`");
            break;

        case ("EXPELLED"):
            commandDescription.addField("Expelled People", "A command that can either `add`, `remove` or `list` people from the expelled players. Once a person is in this list they can't use the `-verify` command.\n\nUsage:\n`-expelled [add / remove / list] (Player Name, needed only if used alongside with `add` or `remove`)`");
            break;

        case ("EXPELLEDGUILDS"):
            commandDescription.addField("Expelled Guilds", "A command that can either `add`, `remove` or `list` people from the expelled guilds. Once a guild is in this list any of the members that were or are in that guild won't be able to get automatically verified using the `-verify` command.\n\nUsage:\n`-expelled [add / remove / list] (Guild Name, needed only if used alongside with `add` or `remove`)`");
            break;

        case ("FAQRESET"):
            commandDescription.addField("FAQ Stylized Message", "Simply sends the stylized message in <#482394590721212416>.\n\nUsage:\n`-faqReset`");
            break;

        case ("FIX"):
            commandDescription.addField("Nicknames in need of a fix", "Lists all the people in the server that don't have a nickname and have a <@&378989711793848332> role.\n\nUsage:\n`-fix`");
            break;

        case ("HELLO"):
            commandDescription.addField("Hello!", "The bot responds with a stylized message and attaches the bot's profile picture.`");
            break;

        case ("LOG"):
            commandDescription.addField("Log", "Logs a run from a <@&372590164943437825> or a <@&384029438188453898>. Can also give additional credits to any other people who helped complete the run.\n\nUsage:\n`-log [Cult / Void] (Any additional comment goes here, any mentions will give a secondary credit to that mentioned person if chosen so.)`");
            break;

        case ("PARSEMEMBERS"):
            commandDescription.addField("Parse Members", "Parses members ***only*** from a /who image in game (it seperates names using a comma as an indicator for the next name) and finds who is in voice but not in game (this part is unreliable as our nicknames in this discord are not consistent) but does find people who are in the server, not in voice, but in game.\n\nUsage:\n`-parseMembers [Raiding Voice Channel Number] + [Image Attachment with a cropped /who list]`");
            break;

        case ("PENDING"):
            commandDescription.addField("Pending People", "A command that can `remove` people from the pending list. Once a person is in this list they can't use the `-verify` command, this is used for people who get their verification bugged.\n\nUsage:\n`-expelled [remove] [Player Name]`");
            break;

        case ("RESTART"):
            commandDescription.addField("Restart", "Logs the bot in and out of Discord Servers. Messes up any commands that need a constant connection (most commands). Use at risk, mainly broken.\n\nUsage:\n`-restart`");
            break;

        case ("RESTARTVERI"):
            commandDescription.addField("Verification Stylized Message", "Simply sends the stylized message in <#471711348095713281> that explains how to verify and removes ANY message it can find.\n\nUsage:\n`-restartVeri`");
            break;

        case ("RULESRESET"):
            commandDescription.addField("Rules Stylized Message", "Simply sends the stylized message in <#482368517568462868>.\n\nUsage:\n`-rulesReset`");
            break;

        case ("SAFEGUARD"):
            commandDescription.addField("Safeguard", "Adds one of these commands to the safeguard list: `AFK`, `Clean`, `SplitVoid`, `Suspend`, which will prompt an extra check before initializing the commands.\n\nUsage:\n`-safeGuard [add / remove / list] [AFK / Clean / SplitVoid / Suspend]`");
            break;

        case ("SETPRESENCE"):
            commandDescription.addField("Set Presence", "Changes the activity the bot is doing in the members list. Usable only by admins or Lanis.\n\nUsage:\n`-setPresence [Watching / Playing / Listening] [Any words that follow up that prefix]`");
            break;

        case ("SPLITVOID"):
            commandDescription.addField("Void Split", "Sets up a void split in <#443952835059777549>.\n\nUsage:\n`-splitVoid [Raiding Voice Channel Number] [2 / 3 / 4 or Small / Medium / Large]`");
            break;

        case ("SUSPEND"):
            commandDescription.addField("Suspend", "Suspends a person. Usable by <@&372590164943437825>s or higher.\n\nUsage:\n`-suspend [User Mention / ID] [Number of length] [Unit of length: `m` for minutes, `h` for hours, `d` for days, `w` for weeks] [Reason here]`");
            break;

        case ("UNSUSPEND"):
            commandDescription.addField("Unsuspend", "Unsuspends a person. Usable by <@&372590164943437825>s or higher.\n\nUsage:\n`-unsuspend [User Mention / ID]`");
            break;

        case ("VERIFIED"):
            commandDescription.addField("Verified People", "A command that can `remove` people from the pending list. Once a person is in this list they can't use the `-verify` command, this is used for people who get their verification bugged.\n\nUsage:\n`-expelled [remove] [Player Name]`");
            break;

        case ("VERIFY"):
            commandDescription.addField("Verify", "Starts a verification for a person if they don't have the <@&378989711793848332>. Generally meant to be used in <#471711348095713281>.\n\nUsage:\n`-verify [In Game Name Here]`");
            break;

        default:
            return await message.channel.send("No such command found, type `-commands` for a full list.");
    }

    await message.channel.send(commandDescription);
    /*
    let reply = new Discord.MessageEmbed()
        .addField("-afk (Raiding Channel Number) (Type) (Custom message sent to people who react with key or vial. Optional.)", "There are two types: 'Void' and 'Cult'. Custom message can be used for anything, usually it's used for inputting the location. Example: `-afk 3 Void USNW Right Bazaar.`")
        .addField("-clean (Raiding Channel Number)", "Will remove all current non raid leaders from a specified raiding voice channel, usage:\n `-clean 1`")
        .addField("-currentWeek", "Will display the amount of runs for all the raid leaders since the last issue of the `-endWeek` command.")
        .addField("-endWeek", "Only usable by Raid Leader Council+ role members, ends the week, shows the amount of runs done in #leader-activity-log")
        .addField("-log (Type) (Custom Message, any pings will be counted as assistant raid leaders. Optional)", "Will log your run inside of #leader-leading-logs, usage: `-log Void also got help from @Person`")
        .addField("-parseMembers (Raiding Channel Number) + [Image Attachment]", "Parses members who are shown in a /who and compares them to members in the specified raiding channel number and tries to find crashers. **Please provide a very clear image of the /who, it should be on a black background if possible.**")
        .addField("-restart", "Restarts the bot. Use this for `-parseMembers` to renew the cached members on bot side. (This is meant to avoid glitches). Can also be used to abort a clean command or really anything.")
        .addField("-safeGuard","Will add you to the safeguard list, where you can choose which commands will be extra guarded from your input. Usage:\n`optIn` adds you to the list\n`optOut` removes you from the list\n`add CommandName` adds the command name to your safeguard list\n`remove CommandName` removes the command from your safeguard list.\n`list` will simply show all the commands that you currently have added.\nWhen replying to a question from the bot simply input `-yes` or `-no`.")
        .addField("-setPresence (Status Type) (Game Name)", "Only usable by Admins or Lanis, just a thing that changes the bot's game and status.")
        .addField("-splitVoid (Raiding Channel Number) (Type, Optional)", "Starts a void group split. There are three types 1) Small, will form 2 groups. 2) Medium, will form 3 groups. 3) Large, will form 4 groups. Example: `-splitVoid 2 Large`" )
        .addField("-suspend","Suspends a person, usage:\n`-suspend <@user mention> <number(must be a whole number)> <unit: w, d, h or m> <reason>`")
        .addField("-verify", "Used for verifying people. Currently just rips data out of RealmEye. This will most likely be reworked.")
        await message.channel.send(reply);
        */
}

module.exports.help = {
    name: "commands"
}