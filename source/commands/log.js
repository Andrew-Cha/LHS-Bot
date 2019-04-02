const Discord = require("discord.js");
const Channels = require("../../data/channels.json");

module.exports.run = async (client, message, args) => {
    const authorRoles = message.member.roles.values();
    let isLeader = false;
    for (role of authorRoles) {
        if (role.name === "Raid Leader" || role.name === "Almost Raid Leader") {
            isLeader = true;
            break;
        }
    }
    if (!isLeader) return await message.channel.send("You have to be a Raid Leader to log your runs.");

    const leader = message.member;
    const type = args[0];
    if (type === undefined) return await message.channel.send("Please input a raid type.");
    
    let raidType = "";
    let borderColor;
    if (type.toUpperCase() === "CULT") {
        raidType = "Cult";
        borderColor = "#cf0202"; //Red
    } else if (type.toUpperCase() === "VOID") {
        raidType = "Void";
        borderColor = "#24048b"; //Purple
    } else {
        return await message.channel.send("Incorrect raid type, input one of these types: `Cult` or `Void`.")
    }

    args.splice(0, 1)
    let customMessage = args.join(" ")

    if (type.toUpperCase() === "CULT") {
        client.database.run(`UPDATE stats SET cultsLed = cultsLed + 1 WHERE ID = '${message.author.id}'`)
        client.database.run(`UPDATE stats SET currentCultsLed = currentCultsLed + 1 WHERE ID = '${message.author.id}'`, () => {
            client.database.get(`SELECT * FROM stats WHERE ID = ${message.author.id}`, async (error, row) => {
                if (row.currentCultsLed + row.currentVoidsLed === 1) {
                    await message.channel.send(`${message.member.toString()}, this is your first run of the week, keep it up!`)
                } else {
                    await message.channel.send(`${message.member.toString()} you now have ${row.currentCultsLed} cults led and ${row.currentVoidsLed} voids led.`)
                }
            })
        })
    } else if (type.toUpperCase() === "VOID") {
        client.database.run(`UPDATE stats SET voidsLed = voidsLed + 1 WHERE ID = '${message.author.id}'`)
        client.database.run(`UPDATE stats SET currentVoidsLed = currentVoidsLed + 1 WHERE ID = '${message.author.id}'`, () => {
            client.database.get(`SELECT * FROM stats WHERE ID = ${message.author.id}`, async (error, row) => {
                if (row.currentCultsLed + row.currentVoidsLed === 1) {
                    await message.channel.send(`${message.member.toString()}, this is your first run of the week, keep it up!`)
                } else {
                    await message.channel.send(`${message.member.toString()} you now have ${row.currentCultsLed} cults led and ${row.currentVoidsLed} voids led.`)
                }
            })
        })
    }


    if (customMessage) {
        const assistantLeadersMentions = message.mentions.members.values();
        let assistantLeaders = "";

        if (assistantLeadersMentions) {
            for (const leader of assistantLeadersMentions) {
                if (leader.id !== message.author.id) {
                    assistantLeaders += " " + leader.toString();
                }
            }
        }

        if (assistantLeaders !== "") {
            await new Promise(async (resolve, reject) => {

                await message.channel.send("Are you sure these people assisted you: " + assistantLeaders + "?");
                const messageFilter = (responseMessage, user) => responseMessage.content != "" && responseMessage.author === message.author;
                const safeGuardCollector = new Discord.MessageCollector(message.channel, messageFilter, { time: 60000 });
                safeGuardCollector.on("collect", async (responseMessage, user) => {
                    if (responseMessage.author === message.author) {
                        if (responseMessage.content === "-yes") {
                            safeGuardCollector.stop("CONTINUE");
                        } else if (responseMessage.content === "-no") {
                            safeGuardCollector.stop("STOP");;
                        } else {
                            await message.channel.send("Please respond with a correct answer: `-yes` or `-no`.");
                        }
                    }
                });

                safeGuardCollector.on("end", async (collected, reason) => {
                    if (reason === "CONTINUE") {
                        resolve("SUCCESS");
                    } else if (reason === "STOP" || reason === "time") {
                        reject("FAILURE");
                    }
                })
            }).then(async () => {
                const assistantLeadersMentions = message.mentions.members.values();
                await message.channel.send("Adding one secondary run to the mentioned peoples' logs.");
                for (const leader of assistantLeadersMentions) {
                    if (leader.user.bot === false) {
                        client.database.run(`UPDATE stats SET assists = assists + 1 WHERE ID = '${leader.user.id}'`)
                        client.database.run(`UPDATE stats SET currentAssists = currentAssists + 1 WHERE ID = '${leader.user.id}'`, () => {
                            client.database.get(`SELECT * FROM stats WHERE ID = ${leader.user.id}`, async (error, row) => {
                                if (row.currentAssists === 1) {
                                    await message.channel.send(`${leader.toString()}, this is your first assist of the week, keep it up!`)
                                } else {
                                    await message.channel.send(`${leader.toString()} you now have ${row.currentAssists} this week.`)
                                }
                            })
                        })
                    }
                }
            }).catch(async () => {
                await message.channel.send("Not adding secondary run credit to the mentioned people.");
            });
        }
    }

    let logEmbed = new Discord.MessageEmbed()
        .setColor(borderColor)
        .addField("**" + raidType + "** run", "By: " + leader.toString())
        .setTimestamp()
    if (customMessage) {
        logEmbed.addField("Additions: ", customMessage)
    }

    await client.channels.get(Channels.leadingLogs.id).send(logEmbed);
}

module.exports.help = {
    name: "log",
    category: "Raiding",
    example: "`-log cult` | `-log void`",
    explanation: "Used to log Lost Halls runs for raid leaders, any mentions will give an assist to the mentioned people."
}