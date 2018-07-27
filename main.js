const Discord = require("discord.js");
const lanisBot = new Discord.Client();
const fileSystem = require("fs");
const path = require('path');

const config = require("./dataFiles/config.json");
const channels = require("./dataFiles/channels.json");
const currentlyVerifyingFile = path.normalize(__dirname + "/dataFiles/currentlyVerifying.json");
const currentlyVerifying = require(currentlyVerifyingFile);
const playersExpelledFile = path.normalize(__dirname + "/dataFiles/expelledPeople.json");
const playersExpelled = require(playersExpelledFile);

//lanisBot.options.disableEveryone = true;
lanisBot.commands = new Discord.Collection();
lanisBot.suspensions = require("./dataFiles/suspensions.json");

let antiflood = new Set();
let antifloodTime = 1;  // in seconds

fileSystem.readdir("./commands", (err, files) => {
    if (err) console.log(err);

    let file = files.filter(f => f.split(".").pop() === "js");

    if (file.length <= 0) {
        console.log("File not found or zero length (empty)");
        return;
    }

    file.forEach((f, i) => {
        let props = require(`./commands/${f}`);
        console.log(`${f} command loaded.`);
        lanisBot.commands.set(props.help.name.toUpperCase(), props);
    });
});

const events = {
    MESSAGE_REACTION_ADD: 'messageReactionAdd',
    MESSAGE_REACTION_REMOVE: 'messageReactionRemove',
};

lanisBot.on('raw', async event => {
    if (!events.hasOwnProperty(event.t)) return;
    const { d: data } = event;
    if (data.channel_id !== channels.verificationsManual) return;

    const user = lanisBot.users.get(data.user_id);
    const channel = lanisBot.channels.get(data.channel_id);

    if (channel.messages.has(data.message_id)) return;

    const message = await channel.fetchMessage(data.message_id);
    const emojiKey = (data.emoji.id) ? `${data.emoji.name}:${data.emoji.id}` : data.emoji.name;
    const reaction = message.reactions.get(emojiKey);

    lanisBot.emit(events[event.t], reaction, user);
});

lanisBot.on('messageReactionAdd', async (reaction, user) => {
    const reactionMessage = reaction.message;
    const reactionChannel = reactionMessage.channel;
    if (user.bot) return;
    if (reactionChannel.id !== channels.verificationsManual) return;

    if (reaction.emoji.name === "🔑") {
        await reactionMessage.clearReactions();
        await reactionMessage.react("✅");
        await reactionMessage.react("❌");
        await reactionMessage.react("🔒");
    } else if (reaction.emoji.name === "🔒") {
        await reactionMessage.clearReactions();
        await reactionMessage.react("🔑");
    } else if (reaction.emoji.name === "✅") {
        const memberVerifyingTag = reactionMessage.embeds[0].description.split(', ')[0];
        const memberVerifyingID = memberVerifyingTag.match(/<@!?(1|\d{17,19})>/)[1];
        const memberVerifying = await reactionMessage.guild.fetchMember(memberVerifyingID);

        const accountName = reactionMessage.embeds[0].description.split(': ')[1];

        let noPerms = false;
        const raiderRole = reactionMessage.guild.roles.find(role => role.name === "Verified Raider");
        await memberVerifying.setNickname(accountName, "Accepted into the server via Automatic Verification.").catch(async e => {
            noPerms = true;
            return await reactionChannel.send("The bot doesn't have permissions to set " + await reactionMessage.guild.fetchMember(memberVerifying.id) + "'s role");
        });
        await memberVerifying.setRoles([raiderRole], "Accepted into the server via Automatic Verification.").catch(async e => {
            noPerms = true;
            return await reactionChannel.send("The bot doesn't have permissions to set " + await reactionMessage.guild.fetchMember(memberVerifying.id) + "'s role");
        });

        if (noPerms) return;
        let index;
        let memberAlreadyVerifying = false;
        for (let i = 0; i < currentlyVerifying.members.length; i++) {
            if (currentlyVerifying.members[i].id === memberVerifying.id) {
                memberAlreadyVerifying = true;
                index = i;
                break;
            }
        }

        if (memberAlreadyVerifying) {
            currentlyVerifying.members.splice(index, 1);
            await fileSystem.writeFile(currentlyVerifyingFile, JSON.stringify(currentlyVerifying), function (err) {
                if (err) return console.log(err);
            });
        }
        await reactionChannel.send("Member " + memberVerifying + "(" + accountName + ") was verified by " + await reactionMessage.guild.fetchMember(user.id));
        await reactionMessage.clearReactions();
        await reactionMessage.react("💯");
    } else if (reaction.emoji.name === "❌") {
        const memberVerifyingTag = reactionMessage.embeds[0].description.split(', ')[0];
        const memberVerifyingID = memberVerifyingTag.match(/<@!?(1|\d{17,19})>/)[1];
        const memberVerifying = await reactionMessage.guild.fetchMember(memberVerifyingID);
        const playerToExpel = reactionMessage.embeds[0].description.split(': ')[1];
        let memberExpelled = false;
        for (let i = 0; i < playersExpelled.members.length; i++) {
            if (playersExpelled.members[i].name === playerToExpel) {
                memberExpelled = true;
                break;
            }
        }
        if (memberExpelled) return await reactionMessage.channel.send(playerToExpel + " is already expelled, " + await reactionMessage.guild.fetchMember(user.id));
        playersExpelled.members[playersExpelled.members.length] = {
            "name": playerToExpel
        }
        await fileSystem.writeFile(playersExpelledFile, JSON.stringify(playersExpelled), function (err) {
            if (err) return console.log(err);
        });
        await reactionMessage.channel.send("Player " + playerToExpel + "(" + memberVerifying + ") was expelled by " + await reactionMessage.guild.fetchMember(user.id));

        let index;
        let memberAlreadyVerifying = false;
        for (let i = 0; i < currentlyVerifying.members.length; i++) {
            if (currentlyVerifying.members[i].id === memberVerifying.id) {
                memberAlreadyVerifying = true;
                index = i;
                break;
            }
        }

        if (memberAlreadyVerifying) {
            currentlyVerifying.members.splice(index, 1);
            await fileSystem.writeFile(currentlyVerifyingFile, JSON.stringify(currentlyVerifying), function (err) {
                if (err) return console.log(err);
            });
        }

        await reactionMessage.clearReactions();
        await reactionMessage.react("🔨");
    }
});

lanisBot.on("ready", async () => {
    console.log(`${lanisBot.user.username} is online!`);
    await lanisBot.channels.get(channels.botCommands).send("Restart successful!");
    await lanisBot.user.setActivity("in Cansonio's garden", { type: "PLAYING" })
    lanisBot.setInterval((async () => {
        for (let i in lanisBot.suspensions) {
            const guildID = lanisBot.suspensions[i].guildID;
            const currentGuild = lanisBot.guilds.get(guildID);
            const member = lanisBot.guilds.get(guildID).members.get(i);
            const memberToUnsuspend = currentGuild.fetchMember(member).then(async (person) => {

                if (!person) return;
                if (Date.now() > lanisBot.suspensions[i].time) {
                    const suspendRole = currentGuild.roles.find(role => role.name === "Suspended but Verified");
                    person.removeRole(suspendRole)

                    for (let i = 0; i < lanisBot.suspensions[person.id].roles.length; i++) {
                        const currentRole = currentGuild.roles.find(role => role.name === lanisBot.suspensions[person.id].roles[i]);
                        person.addRole(currentRole);
                    }

                    delete lanisBot.suspensions[person.id];
                    fileSystem.writeFile("./suspensions.json", JSON.stringify(lanisBot.suspensions), function (err) {
                        if (err) return console.log(err);
                    });
                    await lanisBot.channels.get(channels.suspendLog).send(person + " you have been unsuspended.");
                }
            }).catch((error) => {
            });
        }
    }), 5000);
});

lanisBot.on("message", async message => {
    if (message.author.bot) return;
    if (message.channel.type === "dm") return;
    if (message.content.indexOf(config.prefix) !== 0) {
        if (message.channel.id === channels.verificationsAutomatic) {
            return await message.delete();
        } else {
            return;
        }
    }

    if (message.channel.id !== channels.botCommands && message.channel.id !== channels.verifierLogChat && message.channel.id !== channels.verificationsAutomatic) return;

    if (antiflood.has(message.author.id) && message.content !== "-yes" && message.content !== "-no" && message.channel.id !== channels.verificationsAutomatic) {
        message.delete();
        return message.reply(`You must wait ${antifloodTime} seconds before sending another command.`);
    }

    let prefix = config.prefix;
    let messageArray = message.content.split(" ");
    let command = messageArray[0];
    let args = messageArray.slice(1);

    if (message.channel.id === channels.verificationsAutomatic && command.slice(prefix.length).toUpperCase() !== "VERIFY") return await message.delete(), console.log("Deleted message with content: " + message.content);

    let commandFile = lanisBot.commands.get(command.slice(prefix.length).toUpperCase());
    if (commandFile) commandFile.run(lanisBot, message, args);

    antiflood.add(message.author.id);

    setTimeout(() => {
        antiflood.delete(message.author.id)
    }, antifloodTime * 1000)
});

lanisBot.on("error", console.error);

lanisBot.login(config.token);