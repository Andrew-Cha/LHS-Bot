const Discord = require("discord.js");
const channels = require("../dataFiles/channels.json");
const axios = require("axios");
const cheerio = require("cheerio");

const fs = require('fs');
const path = require('path');
const currentlyVerifyingFile = path.normalize(__dirname + "../../dataFiles/currentlyVerifying.json");
const currentlyVerifying = require(currentlyVerifyingFile);
const playersExpelledFile = path.normalize(__dirname + "../../dataFiles/expelledPeople.json");
const playersExpelled = require(playersExpelledFile);
const expelledGuildsFile = path.normalize(__dirname + "../../dataFiles/expelledGuilds.json");
const expelledGuilds = require(expelledGuildsFile);
const verifiedPeopleFile = path.normalize(__dirname + "../../dataFiles/verifiedPeople.json");
const verifiedPeople = require(verifiedPeopleFile);

module.exports.run = async (lanisBot, message, args) => {
    const errorChannel = lanisBot.channels.get(channels.verificationAttempts);

    if (message.member === null) {
        const errorMessage = await message.channel.send("You are offline on Discord, please change your status to online..");
        await errorChannel.send("Someone tried to verify while having an offline status, bot can't fetch their Discord Account.");
        await sleep(10000);
        await errorMessage.delete();
        await message.delete();
        return;
    }

    const authorRoles = message.member.roles

    let isRaider = false;
    for (role of authorRoles.values()) {
        if (role.name === "Verified Raider") {
            isRaider = true;
            break;
        }
    }
    if (isRaider) {
        const errorMessage = await message.channel.send("You are already a Verified Raider.");
        await errorChannel.send("A Verified Raider " + message.member.toString() + " (" + message.author.username + ") tried to verify.");
        await sleep(10000);
        await errorMessage.delete();
        await message.delete().catch(e => {
            console.log(e);
        });
        return;
    }

    let memberToVerify = args[0];
    const messageChannel = message.channel;
    if (memberToVerify === undefined) {
        const errorMessage = await messageChannel.send("Input a name to verify, please");
        await errorChannel.send("User " + message.member.toString() + " (" + message.author.username + ") tried to verify with no name input.");
        await sleep(10000);
        await errorMessage.delete();
        await message.delete()
        return;
    }

    let memberExpelled = false;
    for (let i = 0; i < playersExpelled.members.length; i++) {
        if (playersExpelled.members[i].name.toUpperCase() === memberToVerify.toUpperCase()) {
            memberExpelled = true;
            break;
        }
    }

    if (memberExpelled) {
        const expelledError = await message.channel.send("Sorry, this member is expelled, cannot verify.");
        await errorChannel.send("User " + message.member.toString() + " (" + message.author.username + ") tried to verify with the in game username " + memberToVerify + ", which is expelled.");
        await sleep(10000);
        await message.delete();
        await expelledError.delete()
    }

    if (memberExpelled) return;

    let memberVerified = false;
    let memberVerifiedNickname = ""
    for (let i = 0; i < verifiedPeople.members.length; i++) {
        if (verifiedPeople.members[i].name.toUpperCase() === memberToVerify.toUpperCase() || verifiedPeople.members[i].id === message.author.id) {
            memberVerified = true;
            memberVerifiedNickname = verifiedPeople.members[i].name;
            break;
        }
    }

    if (memberToVerify.toUpperCase() === "YOUR_ROTMG_NAME_HERE") {
        await errorChannel.send("User " + message.member.toString() + " (" + message.author.username + ") tried to verify with a placeholder name.");
        const wrongInput = await message.channel.send("Input your actual name, not a placeholder.");
        await sleep(10000);
        await wrongInput.delete();
        await message.delete();
    }

    if (memberVerified) {
        const verifiedError = await message.channel.send("Sorry, someone has already applied with the nickname of '" + memberVerifiedNickname + "'");
        await errorChannel.send("User " + message.member.toString() + " (" + message.author.username + ") tried to verify as an already verified person (who used the bot to verify) named " + memberToVerify + ".");
        await sleep(10000);
        await message.delete().catch(error => {
            console.log(error)
        });
        await verifiedError.delete()
    }

    if (memberVerified) return;

    let messageCollector;
    let veriCode;
    let updateTimeLeft;
    let veriCodeEmbed;
    let veriCodeMessage;
    let isAlt = false;
    let DMChannel = await message.author.createDM();
    let timesAttemptedToVerify = 0;

    await new Promise(async (resolve, reject) => {
        const confirmationFilter = (confirmationMessage) => confirmationMessage.content !== "" && confirmationMessage.author.bot === false;
        messageCollector = await DMChannel.createMessageCollector(confirmationFilter, { time: 900000 });
        await errorChannel.send("User " + message.member.toString() + " (" + message.author.username + ") started a verification process with the name '" + memberToVerify + "'");
        let index;
        let memberAlreadyVerifying = false;
        for (let i = 0; i < currentlyVerifying.members.length; i++) {
            if (currentlyVerifying.members[i].name === memberToVerify.toUpperCase() || currentlyVerifying.members[i].id === message.author.id) {
                memberAlreadyVerifying = true;
                index = i;
                break;
            }
        }

        if (!memberAlreadyVerifying) {
            currentlyVerifying.members[currentlyVerifying.members.length] = {
                "id": message.author.id,
                "name": memberToVerify.toUpperCase()
            }
            await fs.writeFile(currentlyVerifyingFile, JSON.stringify(currentlyVerifying), function (err) {
                if (err) return console.log(err);
            });
        } else {
            await message.delete().catch(error => {
                console.log(error);
            });
            await messageCollector.stop();
            await errorChannel.send("User " + message.member.toString() + " (" + message.author.username + ") tried to verify when they already have a verification pending.");
            return await DMChannel.send("There is already a verification pending.");
        }

        const generator = require('generate-password');

        veriCode = generator.generate({
            length: 10,
            numbers: true
        });

        veriCode = "LHS_" + veriCode;

        veriCodeEmbed = new Discord.MessageEmbed()
            .setColor('#337b0a')
            .addField("Add this code to your RealmEye profile description (make sure that this is the only text in a line of the description) and respond with `done` after that is done. Respond with `stop` or `abort` if you want to stop this.", "```css\n" + veriCode + "\n```\nAlso make sure these conditions are met before verifying:\n1) Your profile is public\n2) **Only** the location is set to hidden.")
            .setFooter("Time left: 15 minutes 0 seconds");
        let disabledDM = false;
        veriCodeMessage = await DMChannel.send(veriCodeEmbed).catch(async (e) => {
            await errorChannel.send("User " + message.member.toString() + " (" + message.author.username + ") tried to verify with their DMs turned off.");
            const errorMessage = await messageChannel.send(message.author + ", you have your DMs turned off, please turn them on.");;
            await sleep(10000);
            await errorMessage.delete();
            await message.delete()
            disabledDM = true;
        });

        if (disabledDM) {
            currentlyVerifying.members.splice(index, 1);
            await fs.writeFile(currentlyVerifyingFile, JSON.stringify(currentlyVerifying), function (err) {
                if (err) return console.log(err);
            });
            return
        }

        let timeTotal = messageCollector.options.time;
        updateTimeLeft = setInterval(() => {
            const embed = veriCodeMessage.embeds[0];
            timeTotal -= 5000;
            const minutesLeft = Math.floor(timeTotal / 60000);
            const secondsLeft = Math.floor((timeTotal - minutesLeft * 60000) / 1000);
            veriCodeEmbed.setFooter("Time left: " + minutesLeft + " minutes " + secondsLeft + " seconds.");
            veriCodeMessage.edit(veriCodeEmbed);
        }, 5000);

        let currentlyCheckingRequirements = false;

        messageCollector.on("collect", async (responseMessage, user) => {
            if (!/[^a-zA-Z]/.test(responseMessage.content)) {
                if (responseMessage.content.toUpperCase() === "DONE") {
                    if (!currentlyCheckingRequirements) {
                        if (timesAttemptedToVerify >= 5) {
                            await errorChannel.send("User " + message.member.toString() + " (" + message.author.username + ") tried to verify (typed `done`) already " + timesAttemptedToVerify + " times.");
                        } else {
                            await errorChannel.send("User " + message.member.toString() + " (" + message.author.username + ") tried to verify.");
                        }
                        await DMChannel.send("Currently verifying, please wait.");
                        if (memberToVerify === message.author.username) {
                            let capitalizedMemberToVerify = capitalizeFirstLetter(memberToVerify);
                            if (capitalizedMemberToVerify !== message.author.username) {
                                memberToVerify = capitalizedMemberToVerify;
                            } else {
                                let lowerCaseMemberToVerify = lowerCaseFirstLetter(memberToVerify);
                                memberToVerify = lowerCaseMemberToVerify;
                            }
                        }
                        currentlyCheckingRequirements = true;
                        await verifyMember(memberToVerify);
                        currentlyCheckingRequirements = false;
                        timesAttemptedToVerify += 1;
                    } else {
                        await DMChannel.send("The bot is currently is reading data off of RealmEye, please wait.");
                    }
                } else if (responseMessage.content.toUpperCase() === "ABORT" || responseMessage.content.toUpperCase() === "STOP") {
                    await errorChannel.send("User " + message.member.toString() + " (" + message.author.username + ") stopped the verification by saying '" + responseMessage.content + "'");
                    messageCollector.stop("time");
                } else {
                    await errorChannel.send("User " + message.member.toString() + " (" + message.author.username + ") tried to tell the bot '" + responseMessage.content + "' instead of done in any capitalization.");
                    await DMChannel.send("Please respond with a correct answer: `done` or `stop` / `abort`.");
                }
            } else {
                await errorChannel.send("User " + message.member.toString() + " (" + message.author.username + ") tried to tell the bot '" + responseMessage.content + "' instead of done in any capitalization.");
                await DMChannel.send("Please respond with a correct answer: `done` or `stop` / `abort`.");
            }
        });

        messageCollector.on("end", async (collected, reason) => {
            if (reason === "CONTINUE") {
                resolve("SUCCESS")
            } else if (reason === "STOP") {
                reject("FAILURE");
                isAlt = true;
            } else if (reason === "time") {
                reject("FAILURE");
            }
        })
    }).then(async () => {
        clearInterval(updateTimeLeft);
        await messageCollector.stop();
        let noPerms = false;
        const raiderRole = message.guild.roles.find(role => role.name === "Verified Raider");
        await message.member.setNickname(memberToVerify, "Accepted into the server via Automatic Verification.").catch(async e => {
            noPerms = true;
            await errorChannel.send("User " + message.member.toString() + " (" + message.author.username + ") tried to succesfully verify but the bot didn't have permissions to verify them.");
            return await DMChannel.send("The bot doesn't have permissions to set your nickname, thus removing your pending application.");
        });
        await message.member.roles.add(raiderRole, "Accepted into the server via Automatic Verification.").catch(async e => {
            noPerms = true;
            await errorChannel.send("User " + message.member.toString + " (" + message.author.username + ") tried to succesfully verify but the bot didn't have permissions to verify them.");
            return await DMChannel.send("The bot doesn't have permissions to set your role, thus removing your pending application.");
        });
        let index;
        let memberAlreadyVerifying = false;
        for (let i = 0; i < currentlyVerifying.members.length; i++) {
            if (currentlyVerifying.members[i].name === memberToVerify.toUpperCase() || currentlyVerifying.members[i].id === message.author.id) {
                memberAlreadyVerifying = true;
                index = i;
                break;
            }
        }

        if (memberAlreadyVerifying) {
            currentlyVerifying.members.splice(index, 1);
            await fs.writeFile(currentlyVerifyingFile, JSON.stringify(currentlyVerifying), function (err) {
                if (err) return console.log(err);
            });
        }

        await message.delete();
        if (noPerms) return;
        await errorChannel.send("User " + message.member.toString() + " (" + message.author.username + ") got successfully verified.");
        await veriCodeEmbed.setFooter("The Verification process is completed.");
        await veriCodeMessage.edit(veriCodeEmbed);
        await DMChannel.send("Verification is successful, welcome to Public Lost Halls!")
        await lanisBot.channels.get(channels.verificationsLog).send("The bot has verified a member " + message.author.toString() + " with the in game name of '" + memberToVerify + "', https://www.realmeye.com/player/" + memberToVerify);
        if (!memberVerified) {
            verifiedPeople.members[verifiedPeople.members.length] = {
                "id": message.author.id,
                "name": memberToVerify.toUpperCase()
            }
            await fs.writeFile(verifiedPeopleFile, JSON.stringify(verifiedPeople), function (err) {
                if (err) return console.log(err);
            });
        }
    }).catch(async (e) => {
        console.log(e);
        await messageCollector.stop();
        let index;
        let memberAlreadyVerifying = false;
        for (let i = 0; i < currentlyVerifying.members.length; i++) {
            if (currentlyVerifying.members[i].name === memberToVerify.toUpperCase() || currentlyVerifying.members[i].id === message.author.id) {
                memberAlreadyVerifying = true;
                index = i;
                break;
            }
        }

        if (!isAlt) {
            if (memberAlreadyVerifying) {
                currentlyVerifying.members.splice(index, 1);
                await fs.writeFile(currentlyVerifyingFile, JSON.stringify(currentlyVerifying), function (err) {
                    if (err) return console.log(err);
                });
            }
        }

        if (isAlt) {
            await errorChannel.send("User " + message.member.toString() + " (" + message.author.username + ") tried to verify but were suspected to be an alt.");
            await DMChannel.send("There was a problem verifying your account. Please wait for a manual verification to be done by the staff. This is will take 2-3 hours usually, 48 hours if the world is about to end or some emergency is present. Don't message staff about it, as the verification will be looked at eventually, thanks :)");
        } else {
            await errorChannel.send("User " + message.member.toString() + " (" + message.author.username + ") tried to verify but their verification was stopped.");
            await DMChannel.send("The Verification process is now stopped.");
        }
        clearInterval(updateTimeLeft);
        await veriCodeEmbed.setFooter("The Verification process is stopped.");
        await veriCodeMessage.edit(veriCodeEmbed);
        await message.delete().catch(error => {
            console.log(error)
        });
        return;
    });


    async function verifyMember(memberToVerify) {
        let blackListedGuilds = [];
        let blackListedNames = [];
        let oldAccount = false;
        let starCount = 0;
        let maxCharCount = 0;
        let isInBlacklistedGuild = false;
        let isBlacklisted = false;
        let fameCount = 0;
        let errorMessages = [];
        let reportMessages = [];
        let deaths;
        await axios.get("https://www.realmeye.com/player/" + memberToVerify, { headers: { 'User-Agent': 'Public Halls (LHS) Verification Bot' } }).then(async response => {
            if (response.status === 200) {
                const htmlData = response.data;
                const $ = cheerio.load(htmlData);

                const playerName = $('.entity-name').text();
                if (playerName.toUpperCase() !== memberToVerify.toUpperCase()) {
                    await errorChannel.send("User " + message.member.toString() + " (" + message.author.username + ") tried to verify with an invalid / hidden Realmeye profile.");
                    return await DMChannel.send("Member not found, please make sure your RealmEye profile isn't private or that the input name is correct. If you recently changed this give the bot a minute to renew your page.");
                }

                let descriptionLines = [];
                let descriptions = $('.description-line').each(function (i, elem) {
                    descriptionLines[i] = $(this).text()
                });

                let codeFound = false;
                for (const descriptionLine of descriptionLines) {
                    if (descriptionLine.includes(veriCode)) codeFound = true;
                }

                if (!codeFound) {
                    errorMessages.push("Cannot find the generated VeriCode in the description of the specified member. If you recently changed this give the bot a minute to renew your page.");
                }

                const characterCount = $('.active').text().replace(/[^0-9]/g, '');
                if (characterCount < 1) {
                    errorMessages.push("Can't find any characters of the profile '" + memberToVerify + "', make sure they aren't hidden. If you recently changed this give the bot a minute to renew your page.");
                }

                const charStats = $('.player-stats').text();
                const charStatsSplit = charStats.match(/.{3}/g)

                if (charStatsSplit) {
                    for (const charStats of charStatsSplit) {
                        if (charStats !== "0/8" && charStats !== "1/8" && charStats !== "2/8") maxCharCount += 1;
                    }
                }

                if (maxCharCount < 3) {
                    reportMessages.push("Doesn't have enough characters above 3/8.");
                }

                const firstSeen = $('.summary').text().split(" ");
                if (firstSeen.includes("year") || firstSeen.includes("years")) {
                    oldAccount = true;
                } else {
                    reportMessages.push("The account has a hidden creation date or is less than a year old.");
                }

                starCount = $(".star-container").text();
                if (!starCount) {
                    errorMessages.push("Your stars are hidden, please unprivate them. If you recently changed this give the bot a minute to renew your page.");
                } else if (starCount < 30) {
                    reportMessages.push("The account has less than 30 stars.");
                }

                const lastLocation = $('.timeago').text();
                if (lastLocation) {
                    errorMessages.push("Your location is not set to hidden, please hide it. If you recently changed this give the bot a minute to renew your page.");
                }

                fameCount = $('tr').filter(function () {
                    return $(this).children().first().text() === 'Fame';
                }).children().last().text().replace(/ *\([^)]*\) */g, "");

                if (fameCount) {
                    if (fameCount < 1000) {
                        reportMessages.push("Has below 1000 fame");
                    }
                } else {
                    errorMessages.push("Failed to fetch the fame from your profile, please make sure it's not hidden.");
                }

                const currentGuild = $('tr').filter(function () {
                    return $(this).children().first().text() === 'Guild';
                }).children().last().text();
                const currentGuildFixed = currentGuild.replace(/[^A-Za-z0-9]/g, '');

                for (const guildName of expelledGuilds.guilds) {
                    const guildNameFixed = guildName.name.replace(/[^A-Za-z0-9]/g, '');
                    blackListedGuilds.push(guildNameFixed.toUpperCase());
                }

                if (currentGuild) {
                    if (blackListedGuilds.includes(currentGuildFixed.toUpperCase())) {
                        isInBlacklistedGuild = true;
                        reportMessages.push("Is in a blacklisted guild. (" + currentGuild + ")");
                    }
                } else {
                    isBlacklisted = true;
                    reportMessages.push("Couldn't find guild or guild is private.");
                }

                await axios.get('https://www.realmeye.com/name-history-of-player/' + memberToVerify, { headers: { 'User-Agent': 'Public Halls (LHS) Verification Bot' } })
                    .then(async response => {
                        if (response.status === 200) {
                            const html = response.data;
                            const $ = cheerio.load(html);

                            let previousNames = [];
                            $('#e tbody tr').each(function () {
                                previousNames.push($(this).children().first().text())
                            })

                            if (previousNames.length === 0) {
                                reportMessages.push("Has no previous names or failed to read them.")
                            }

                            for (const name of playersExpelled.members) {
                                blackListedNames.push(name.name);
                            }

                            for (const previousName of previousNames) {
                                if (blackListedNames.includes(previousName.toUpperCase())) {
                                    isBlacklisted = true;
                                    reportMessages.push("Member has a blacklisted name in their name history: " + previousName);
                                    break;
                                }
                            }
                        }
                    })
                    .catch(async e => {
                        console.log(e);
                        await errorChannel.send("User " + message.member.toString() + " (" + message.author.username + ") tried to verify but the bot failed to fetch the name history page on RealmEye.");
                        await DMChannel.send("Failed when trying to read your name history.");
                    })
            }

            await axios.get("https://www.realmeye.com/graveyard-summary-of-player/" + memberToVerify, { headers: { 'User-Agent': 'Public Halls (LHS) Verification Bot' } }).then(async response => {
                if (response.status === 200) {
                    const html = response.data;
                    const $ = cheerio.load(html);

                    let deathString = $('td').last().text();
                    deaths = deathString;
                }
            }).catch(async e => {
                console.log(e);
                await errorChannel.send("User " + message.member.toString() + " (" + message.author.username + ") tried to verify but the bot failed to fetch the graveyard history page on RealmEye.");
                errorMessages.push("Failed while trying to read your graveyard history.")
            });

            if (deaths === "hidden") {
                reportMessages.push("No Data for the deaths of the player or they are hidden.")
            } else if (deaths < 100) {
                reportMessages.push("The player has less than 100 deaths.");
            } else if (!deaths >= 100) {
                reportMessages.push("No Data for the deaths of the player or they are hidden.")
            }

            await axios.get('https://www.realmeye.com/guild-history-of-player/' + memberToVerify, { headers: { 'User-Agent': 'Public Halls (LHS) Verification Bot' } })
                .then(async response => {
                    if (response.status === 200) {
                        const html = response.data;
                        const $ = cheerio.load(html);

                        let previousNames = [];
                        $('#e tbody tr').each(function () {
                            previousNames.push($(this).children().first().text())
                        })

                        if (previousNames.length === 0) {
                            isInBlacklistedGuild = true;
                            reportMessages.push("Has no previous guilds or failed to read them.")
                        }

                        for (const previousName of previousNames) {
                            if (blackListedGuilds.includes(previousName.toUpperCase())) {
                                isInBlacklistedGuild = true;
                                reportMessages.push("Member has been in a blacklisted guild before: " + previousName);
                                break;
                            }
                        }
                    }
                })
                .catch(async e => {
                    await errorChannel.send("User " + message.member.toString() + " (" + message.author.username + ") tried to verify but the bot failed to fetch the guild history page on RealmEye.");
                    console.log(e);
                    errorMessages.push("Failed when trying to read your guild history.");
                })

            if (errorMessages.length !== 0) {
                let errorReport = "";
                for (const errorMessage of errorMessages) {
                    errorReport = errorReport + errorMessage + "\n";
                }
                await DMChannel.send(errorReport);
                await errorChannel.send("User " + message.member.toString() + " (" + message.author.username + ") tried to verify and had these problems:\n" + errorReport);
            } else if (maxCharCount < 3 || fameCount < 1000 || starCount < 30 || deaths < 100 || oldAccount === false || isBlacklisted || isInBlacklistedGuild) {
                console.log("Verifying person: " + memberToVerify)
                console.log("Above 3 max chars: " + maxCharCount)
                console.log("Fame above 1k: " + fameCount)
                console.log("Star count above 30: " + starCount)
                console.log("Death count above 100: " + deaths)
                console.log("Old account: " + oldAccount)
                console.log("Is blacklisted?: " + isBlacklisted)
                console.log("is in blacklisted guild?: " + isInBlacklistedGuild)
                let reportMessage = "";
                for (const errorMessage of reportMessages) {
                    reportMessage = reportMessage + errorMessage + "\n";
                }
                reportMessage = reportMessage + "[Player Profile](https://www.realmeye.com/player/" + memberToVerify + ")";

                let reportEmbed = new Discord.MessageEmbed()
                    .setColor("#940000")
                    .setDescription(message.member.toString() + " trying to verify as: " + memberToVerify)
                    .addField("Problems: ", reportMessage)

                const verificationsManual = lanisBot.channels.get(channels.verificationsManual)
                const altReportMessage = await verificationsManual.send(reportEmbed);
                await altReportMessage.react("🔑")
                await altReportMessage.pin();
                const systemMesssages = await verificationsManual.messages.fetch({ after: altReportMessage.id }).catch(e => { console.log(e) });
                for (let message of systemMesssages.values()) {
                    if (message.system) {
                        await message.delete();
                    }
                }
                console.log(systemMesssages)

                messageCollector.stop("STOP");
            } else {
                messageCollector.stop("CONTINUE");
            }
        }).catch(async e => {
            await errorChannel.send("User " + message.member.toString() + " (" + message.author.username + ") tried to verify and there was a problem sending a request to their RealmEye page.");
            console.log(e);
            return await DMChannel.send("Failed while trying to verify.");
        });
    }
}

module.exports.help = {
    name: "verify"
}

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function lowerCaseFirstLetter(string) {
    return string.charAt(0).toLowerCase() + string.slice(1);
}