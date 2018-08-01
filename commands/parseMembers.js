const Discord = require("discord.js");
const Vision = require('@google-cloud/vision');
const fs = require('fs');
const channels = require("../dataFiles/channels.json");
const Jimp = require("jimp");

module.exports.run = async (lanisBot, message, args) => {
    const visionClient = new Vision.ImageAnnotatorClient({
        keyFilename: './dataFiles/visionConfig.json'
    });
    const imageAttached = Array.from(message.attachments.values())[0];
    if (imageAttached === undefined) return await message.channel.send("Please attach an image to your command.");
    const imageURL = imageAttached.url;
    const wantedChannel = args[0];
    if (wantedChannel === undefined) return await message.channel.send("Please input which raiding channel should the bot parse members for.");
    let raidingChannel;
    let channelNumber;
    const raidingChannelCount = Object.keys(channels.raidingChannels).length;

    if (0 < wantedChannel && wantedChannel <= raidingChannelCount) {
        channelNumber = wantedChannel - 1;
        raidingChannel = lanisBot.channels.get(channels.raidingChannels[channelNumber]);
    } else {
        const error = "No such raiding channel found to set up for raiding.";
        await message.channel.send(error);
        return;
    }

    await Jimp.read(imageURL).then(async function (image) {
        //image.greyscale();
        await image.write("./files/images/who.png");
        await sleep(1000);
    }).catch(function (err) {
        return message.channel.send("Failed to fetch the image from Discord.");
    })

    const imageToParse = "./files/images/who.png";

    await visionClient
        .textDetection(imageToParse)
        .then(async results => {
            const detections = results[0].textAnnotations;
            let peopleList = detections[0].description.substring(detections[0].description.indexOf(":") + 2).replace(/(\r\n\t|\n|\r\t)/gm, " ").split("0").join("O").split(", ");
            peopleList.pop();
            let capitalizedPeopleList = [];

            for (const person of peopleList) {
                capitalizedPeopleList.push(person.toUpperCase());
            }

            const members = raidingChannel.members;
            await message.channel.send("--- **Parse Results for Raiding Channel #" + wantedChannel + "** ---");
            await message.channel.send("Bot sees that " + members.size + " people are in voice, could this be the problem to all the people appearing in the crashers part?");
            await message.channel.send("Bot sees a total of: " + peopleList.length + " people in the image.");
            let peopleInVoice = [];
            let peopleCrashing = [];
            let peopleNotInVoice = [];

            for (const member of members.values()) {
                const memberName = member.displayName;
                const memberNameFixed = memberName.replace(/[^A-Za-z0-9]/g, '');

                if (!capitalizedPeopleList.includes(memberNameFixed.toUpperCase())) {
                    if (member.id !== message.author.id) {
                        peopleNotInVoice.push(member);
                    }
                } else {
                    peopleInVoice.push(memberNameFixed.toUpperCase());
                }
            }

            for (const crasherName of peopleList) {
                if (!peopleInVoice.includes(crasherName.toUpperCase())) {
                    peopleCrashing.push(crasherName);
                }
            }

            if (peopleNotInVoice.length > 0) {
                const notInVoiceWarning = "These people are in voice but not in game, possible alts:\n";
                await message.channel.send(notInVoiceWarning);
                let notInVoiceString = "";
                for (const member of peopleNotInVoice) {
                    const newReportMessage = notInVoiceString !== "" ? notInVoiceString + ", " + member : member;
                    if (newReportMessage.length > 2000) {
                        await message.channel.send(notInVoiceString);
                        notInVoiceString = member + ", ";
                    } else {
                        notInVoiceString = newReportMessage;
                    }
                }
                await message.channel.send(notInVoiceString);
            } else {
                await message.channel.send("**No members found that are in voice but not in game.**");
            }


            if (peopleCrashing.length > 0) {
                const peopleCrashingWarning = "These people are not in voice, they are crashers:";
                await message.channel.send(peopleCrashingWarning);
                let peopleCrashingString = "";

                await message.guild.fetchMembers().then(async guild => {
                    for (const member of peopleCrashing) {
                        let memberFound = false;
                        for (const guildMember of guild.members.values()) {
                            if (guildMember.displayName === member) {
                                console.log("Found member named " + member);
                                memberFound = true;
                            } else {
                                continue;
                            }
                            const newPeopleCrashingMessage = peopleCrashingString !== "" ? peopleCrashingString + ", " + guildMember : guildMember;
                            if (newPeopleCrashingMessage.length > 2000) {
                                await message.channel.send(peopleCrashingString);
                                peopleCrashingString = guildMember + ", "
                            } else {
                                peopleCrashingString = newPeopleCrashingMessage;
                            }
                        }

                        if (!memberFound) {
                            const newPeopleCrashingMessage = peopleCrashingString !== "" ? peopleCrashingString + ", " + member : member;
                            if (newPeopleCrashingMessage.length > 2000) {
                                await message.channel.send(peopleCrashingString);
                                peopleCrashingString = member + ", "
                            } else {
                                peopleCrashingString = newPeopleCrashingMessage;
                            }
                        }
                    }
                    await message.channel.send(peopleCrashingString);
                }).catch(async e => {
                    await message.channel.send("Error at fetching crashers from the server.");
                })
            } else {
                await message.channel.send("**No crashers found.**");
            }

            if ((peopleCrashing.length + peopleNotInVoice.length) >= peopleList.length) {
                await message.channel.send("More than half of the people are crashers, which might be a bit innaccurate. Please be cautious of these results.");
            }
        })
        .catch(async err => {
            console.error('ERROR:', err);
            return await message.channel.send("An error occured while trying to read members from the image.");
        });
}

module.exports.help = {
    name: "parseMembers"
}

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}