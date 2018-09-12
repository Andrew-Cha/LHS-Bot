const Discord = require("discord.js");

module.exports.run = async (lanisBot, message, args) => {
    const commandListUncapitalized = ["AFK", "all", "clean", "currentWeek", "dice", "duplicateMembers", "endWeek", "expelled", "expelledGuilds", "faq", "fix", "hello", "log", "parseMembers", "restart", "restartVeri", "rules", "safeGuard", "say", "setPresence", "splitVoid", "suspend", "unsuspend", "verify"]
    const commandList = ["AFK", "ALL", "CLEAN", "CURRENTWEEK", "DICE", "ENDWEEK", "EXPELLED", "EXPELLEDGUILDS", "FIX", "HELLO", "LOG", "PARSEMEMBERS", "RESTART", "RESTARTVERI", "SAFEGUARD", "SETPRESENCE", "SPLITVOID", "SUSPEND", "UNSUSPEND", "VERIFY"];
    let command;
    if (args.length > 0) {
        command = args[0].toUpperCase();
    } else {
        command = "ALL";
    }

    let commandDescription = new Discord.MessageEmbed();

    switch (command) {
        case ("AFK"):

            break;
        case ("ALL"):
            let index = 0;
            let list = ""
            for (const command of commandListUncapitalized) {
                let newLineNeeded = false;
                if (index % 2 === 0) {
                    newLineNeeded = true;
                }

                const newLine = nextLineNeeded ? newList = list + " ឵឵ ឵឵" + command + "\n" : newList = list + " ឵឵ ឵឵" + command;

                if (newList.length > 1024) {
                    commandDescription.addField(" ឵឵ ឵឵", list);
                    list = command;
                } else {
                    list = newList;
                }
                index += 1;
            }
            commandDescription.addField("All Commands", list)
            break;
        case ("CLEAN"):
            break;
        case ("CURRENTWEEK"):
            break;
        case ("DICE"):
            break;
        case ("ENDWEEK"):
            break;
        case ("EXPELLED"):
            break;
        case ("EXPELLEDGUILDS"):
            break;
        case ("FIX"):
            break;
        case ("HELLO"):
            break;
        case ("LOG"):
            break;
        case ("PARSEMEMBERS"):
            break;
        case ("RESTART"):
            break;
        case ("RESTARTVERI"):
            break;
        case ("SAFEGUARD"):
            break;
        case ("SETPRESENCE"):
            break;
        case ("SPLITVOID"):
            break;
        case ("SUSPEND"):
            break;
        case ("UNSUSPEND"):
            break;
        case ("VERIFY"):
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