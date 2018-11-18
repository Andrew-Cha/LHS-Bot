const Discord = require("discord.js");

const channels = require("../dataFiles/channels.json");
const fs = require('fs');
const path = require('path');
const safeGuardConfigsFile = path.normalize(__dirname + "../../dataFiles/safeGuardConfigs.json");
const safeGuardConfigs = require(safeGuardConfigsFile);

module.exports.run = async (lanisBot, message, args) => {
    const wantedChannel = args[0];
    const raidingChannelCount = Object.keys(channels.eventRaidingChannels.id).length;
    let abortRestart = false;

    if (!wantedChannel) return await message.channel.send("Input an existing raiding channel number to clean up in.");
    let raidingChannel;

    if (0 < wantedChannel && wantedChannel <= raidingChannelCount) {
        const channelNumber = wantedChannel - 1;
        raidingChannel = lanisBot.channels.get(channels.eventRaidingChannels.id[channelNumber]);
    } else {
        const error = "No such raiding channel found to set up for raiding.";
        await message.channel.send(error);
        return;
    }

    let index;
    let currentLeader;
    for (let i = 0; i < safeGuardConfigs.leaders.length; i++) {
        if (safeGuardConfigs.leaders[i].id === message.author.id) {
            index = i;
            break;
        }
    }

    if (index != undefined) {
        currentLeader = safeGuardConfigs.leaders[index];
        if (currentLeader.commands.includes("CLEAN")) {
            let abortCheck = false;
            await new Promise(async (resolve, reject) => {
                await message.channel.send("Are you sure you want to clean Raiding Channel Number " + wantedChannel + " from members?");
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
            }).then(async (successMessage) => {
                await message.channel.send("Starting the Cleaning.");
            }).catch(async (failureMessage) => {
                await message.channel.send("Stopping the Cleaning.");
                abortCheck = true;
            });
            if (abortCheck) return;
        }
    }


    let abortEmbed = new Discord.MessageEmbed()
        .addField(`Abort Cleaning Channel Number **${wantedChannel}**`, `If you made a mistake you can abort the cleaning now.`);

    const abortMessage = await message.channel.send(abortEmbed);
    abortMessage.react("❌");
    const abortFilter = (reaction, user) => reaction.emoji.name === "❌"
    const abortReactCollector = new Discord.ReactionCollector(abortMessage, abortFilter, { time: 360000 });
    abortReactCollector.on("collect", async (reaction, user) => {
        const currentMember = await message.guild.members.get(reaction.users.last().id);
        if (reaction.emoji.name === "❌") {
            if (!reaction.users.last().bot) {
                if (currentMember) {
                    abortRestart = true;
                    await abortReactCollector.stop();
                    await message.channel.send("Cleaning aborted by " + currentMember.toString());
                    return;
                }
            }
        }
    });

    abortReactCollector.on("end", async (collected, reason) => {
        abortMessage.delete().catch(e => {
            console.log(e)
        });
    });

    const members = raidingChannel.members;
    await message.channel.send("Cleaning is started.");
    for (member of members.values()) {
        if (!abortRestart) {
            if (!member.bot) {
                if (raidingChannel.members.has(member.id)) {
                    if (!member.hasPermission("MOVE_MEMBERS")) {
                        await member.setVoiceChannel(channels.queues.id[0]);
                    }
                }
            }
        } else {
            break;
            return;
        }
    }
    abortMessage.delete();
    await message.channel.send("Cleaning is finished.");
}

module.exports.help = {
    name: "clean"
}