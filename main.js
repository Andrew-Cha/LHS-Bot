const Discord = require("discord.js");
const lanisBot = new Discord.Client();
const fileSystem = require("fs");

const config = require("./config.json");
const channels = require("./channels.json");

lanisBot.options.disableEveryone = true;
lanisBot.commands = new Discord.Collection();
lanisBot.suspensions = require("./suspensions.json");

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
        lanisBot.commands.set(props.help.name, props);
    });
});

lanisBot.on("ready", async () => {
    console.log(`${lanisBot.user.username} is online!`);

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
    if (message.content.indexOf(config.prefix) !== 0) return;
    if (message.channel.id !== channels.botCommands && message.channel.id !== channels.verifierLogChat) return;

    if (antiflood.has(message.author.id)) {
        message.delete();
        return message.reply(`You must wait ${antifloodTime} seconds before sending another command.`);
    }

    let prefix = config.prefix;
    let messageArray = message.content.split(" ");
    let command = messageArray[0];
    let args = messageArray.slice(1);

    let commandFile = lanisBot.commands.get(command.slice(prefix.length));
    if (commandFile) commandFile.run(lanisBot, message, args);

    antiflood.add(message.author.id);

    setTimeout(() => {
        antiflood.delete(message.author.id)
    }, antifloodTime * 1000)
});

lanisBot.on("error", console.error);

lanisBot.login(config.token);