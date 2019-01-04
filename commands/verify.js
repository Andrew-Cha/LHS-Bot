const Discord = require("discord.js");
const Channels = require("../dataFiles/channels.json");
const Roles = require("../dataFiles/roles.json")
const axios = require("axios");
axios.defaults.timeout = 10000;
const cheerio = require("cheerio");

const fs = require('fs');

module.exports.run = async (lanisBot, message, args) => {
    const errorChannel = lanisBot.channels.get(Channels.verificationAttempts.id);
    let errorEmbed = new Discord.MessageEmbed()
        .setColor("#cf0202");

    if (message.member === null) {
        await rejectCommand(`<@${message.author.id}>, you are offline on Discord, please change your status to online.`,
            `<@${message.author.id}> tried to verify while having an offline status, the bot couldn't fetch their Discord Account.`)
        return
    }

    const authorRoles = message.member.roles

    if (authorRoles.find(role => role.id === Roles.verifiedRaider.id)) {
        await rejectCommand(`${message.member.toString()}, you are already a Verified Raider.`,
            `A Verified Raider ${message.member.toString()} (${message.author.username}) tried to verify.`)
        return
    }

    let inGameName = args[0];
    if (inGameName === undefined) {
        await rejectCommand(`${message.member.toString()}, input a name to verify, please.`,
            `User ${message.member.toString()} (${message.author.username}) tried to verify with no name input.`)
        return
    }

    if (inGameName.length > 10) {
        await rejectCommand(`${message.member.toString()}, input a valid name to verify, please.`,
            `User ${message.member.toString()} (${message.author.username}) tried to verify with a name that is longer than 10 characters (${inGameName})`)
        return
    }

    if (inGameName.toUpperCase() === "YOUR_ROTMG_NAME_HERE") {
        await rejectCommand(`${message.member.toString()}, input your actual in game name, not an example placeholder.`,
            `User ${message.member.toString()} (${message.author.username}) tried to verify with a placeholder name.`)
        return;
    }

    let activeVerificationStatusMessage
    let DMChannel = await message.author.createDM()
    let DMMessageCollector
    let maxVerificationsAllowedAtOnce = 3
    let maxVerificationTimeAllowed = 5 //in minutes
    let memberIsExpelled = false
    let memberIsPending = false
    let memberIsVerified = false
    let isAlt = false
    let timesAttemptedToVerify = 0;
    let updateTimeLeft
    let veriCode
    let veriCodeEmbed
    let veriCodeMessage

    lanisBot.database.get(`SELECT * FROM expelled WHERE name = '${inGameName.toUpperCase()}'`, async (error, row) => {
        if (error) {
            throw error
        }

        if (row !== undefined) memberIsExpelled = true

        if (memberIsExpelled) {
            await rejectCommand(`${message.member.toString()}, this member is expelled, contact a staff member (Security and higher) to appeal.`,
                `User ${message.member.toString()} (${message.author.username}) tried to verify with the in game username "${inGameName}", which is expelled.`)
            return
        }

        lanisBot.database.get(`SELECT * FROM verified WHERE name = '${inGameName.toUpperCase()}' OR ID = '${message.author.id}'`, async (error, row) => {
            if (error) {
                throw error
            }

            if (row !== undefined) memberIsVerified = true

            if (memberIsVerified) {
                await rejectCommand(`${message.member.toString()}, someone has already applied with the nickname of ${inGameName} or this account was already verified. Please contact a staff member if you think this is a mistake.`,
                    `User ${message.member.toString()} (${message.author.username}) tried to verify as an already verified person named "${inGameName}"`)
                return
            }

            lanisBot.database.get(`SELECT * FROM pending WHERE name = '${inGameName.toUpperCase()}' OR ID = '${message.author.id}'`, async (error, row) => {

                if (row !== undefined) memberIsPending = true;

                if (!memberIsPending) {
                    if (lanisBot.activeVerificationCount >= maxVerificationsAllowedAtOnce) {
                        await rejectCommand(`${message.member.toString()}, there are already a maximum amount of verifications allowed at the moment (${maxVerificationsAllowedAtOnce}), please try again in around ${maxVerificationTimeAllowed} minutes.`,
                            `User ${message.member.toString()} (${message.author.username}) tried to verify with the in game name of  "${inGameName}", while there were already ${maxVerificationsAllowedAtOnce} verifications active.`)
                        return
                    } else {
                        lanisBot.database.run(`INSERT INTO pending(ID, name) VALUES('${message.author.id}', '${inGameName.toUpperCase()}')`)
                    }
                } else {
                    await rejectCommand(`${message.member.toString()}, there is already a verification pending. If you haven't recently applied, contact a staff member.`,
                        `User ${message.member.toString()} (${message.author.username}) tried to verify with the in game name of  "${inGameName}", while they already have a verification pending.`)
                    return
                }



                await new Promise(async (resolve, reject) => {
                    const confirmationFilter = confirmationMessage => confirmationMessage.content !== "" && confirmationMessage.author.bot === false
                    DMMessageCollector = await DMChannel.createMessageCollector(confirmationFilter, { time: maxVerificationTimeAllowed * 60000 })
                    let successfulVerificationStartEmbed = new Discord.MessageEmbed()
                        .addField("Started Verification", "User " + message.member.toString() + " (" + message.author.username + ") started a verification process with the name '" + inGameName + "'")
                        .setFooter("User ID: " + message.member.id)
                        .setColor("3ea04a");
                    await errorChannel.send(successfulVerificationStartEmbed);

                    const generator = require('generate-password');

                    veriCode = generator.generate({
                        length: 10,
                        numbers: true
                    });

                    veriCode = "LHS_" + veriCode;

                    veriCodeEmbed = new Discord.MessageEmbed()
                        .setColor('#337b0a')
                        .setDescription(message.member.toString() + " verifying as: " + inGameName)
                        .addField("Add this code to one of the description lines of your RealmEye profile.", "```css\n" + veriCode + "\n```\nTo attempt to verify type `done`\nTo stop this type `abort` or `stop`\n\nAlso make sure these conditions are met before verifying:\n1) Your profile is public\n2) **Only** the location is set to hidden.\n\n[A video tutorial if you are having troubles](https://www.youtube.com/watch?v=eCwM8u7b_jM&feature=youtu.be)")
                        .setFooter(`Time left: ${maxVerificationTimeAllowed} minutes 0 seconds`);
                    let disabledDM = false;

                    veriCodeMessage = await DMChannel.send(veriCodeEmbed).catch(async (e) => {
                        await rejectCommand(`${message.member.toString()}, you have your DMs turned off, please turn them on in Settings -> Privacy and Safety -> "Allow direct messages from server members" and then click Yes`,
                            `User ${message.member.toString()} (${message.author.username}) tried to verify with the in game name of  "${inGameName}", while they their DMs turned off.`)
                        disabledDM = true;
                    });

                    if (disabledDM) {
                        lanisBot.database.run(`DELETE FROM pending WHERE ID = '${message.author.id}'`)
                        return
                    }

                    lanisBot.activeVerificationCount += 1
                    let activeVerificationEmbed = new Discord.MessageEmbed()
                        .setColor("3ea04a")
                        .setDescription(message.member.toString() + " trying to verify as: " + inGameName)
                        .addField("Attempts", "0")
                        .setFooter(`Time left: ${maxVerificationTimeAllowed} minutes 0 seconds.`);

                    activeVerificationStatusMessage = await lanisBot.channels.get(Channels.verificationActive.id).send(activeVerificationEmbed);

                    let timeTotal = DMMessageCollector.options.time;
                    updateTimeLeft = setInterval(() => {
                        if (timeTotal <= 0) {
                            clearInterval(updateTimeLeft)
                            DMMessageCollector.stop("time")
                        }
                        timeTotal -= 5000;
                        const minutesLeft = Math.floor(timeTotal / 60000);
                        const secondsLeft = Math.floor((timeTotal - minutesLeft * 60000) / 1000);
                        veriCodeEmbed.setFooter("Time left: " + minutesLeft + " minutes " + secondsLeft + " seconds.");
                        veriCodeMessage.edit(veriCodeEmbed);
                        activeVerificationEmbed.setFooter("Time left: " + minutesLeft + " minutes " + secondsLeft + " seconds.");
                        activeVerificationStatusMessage.edit(activeVerificationEmbed);

                    }, 5000);

                    let currentlyCheckingRequirements = false;

                    DMMessageCollector.on("collect", async (responseMessage, user) => {
                        if (!/[^a-zA-Z]/.test(responseMessage.content)) {
                            if (responseMessage.content.toUpperCase() === "DONE") {
                                if (!currentlyCheckingRequirements) {
                                    let verificationAttemptEmbed = new Discord.MessageEmbed()
                                        .setFooter("User ID: " + message.member.id)
                                    if (timesAttemptedToVerify >= 5) {
                                        verificationAttemptEmbed.addField("Verification Attempt", "User " + message.member.toString() + " (" + message.author.username + ") tried to verify (typed `done`) already " + timesAttemptedToVerify + " times.")
                                            .setColor("#cf0202");
                                    } else {
                                        verificationAttemptEmbed.addField("Verification Attempt", "User " + message.member.toString() + " (" + message.author.username + ") tried to verify.")
                                            .setColor("3ea04a");
                                    }
                                    await errorChannel.send(verificationAttemptEmbed);
                                    await DMChannel.send("Currently verifying, please wait.");
                                    if (inGameName === message.author.username) {
                                        let capitalizedMemberToVerify = capitalizeFirstLetter(inGameName);
                                        if (capitalizedMemberToVerify !== message.author.username) {
                                            inGameName = capitalizedMemberToVerify;
                                        } else {
                                            let lowerCaseMemberToVerify = lowerCaseFirstLetter(inGameName);
                                            inGameName = lowerCaseMemberToVerify;
                                        }
                                    }
                                    currentlyCheckingRequirements = true;
                                    await verifyMember(inGameName);
                                    currentlyCheckingRequirements = false;
                                    timesAttemptedToVerify += 1;
                                    activeVerificationEmbed.fields[0] = { name: "Attempts", value: timesAttemptedToVerify, inline: false };
                                    activeVerificationStatusMessage.edit(activeVerificationEmbed)
                                } else {
                                    await DMChannel.send("The bot is currently is reading data off of RealmEye, please wait.");
                                }
                            } else if (responseMessage.content.toUpperCase() === "ABORT" || responseMessage.content.toUpperCase() === "STOP") {
                                errorEmbed.addField("Verification Stopped", "User " + message.member.toString() + " (" + message.author.username + ") stopped the verification by saying '" + responseMessage.content + "'");
                                await errorChannel.send(errorEmbed);
                                DMMessageCollector.stop("time");
                            } else {
                                let invalidVerificationAttemptEmbed = new Discord.MessageEmbed()
                                    .addField("Invalid Input", "User " + message.member.toString() + " (" + message.author.username + ") tried to tell the bot '" + responseMessage.content + "' instead of done in any capitalization.")
                                    .setFooter("User ID: " + message.member.id)
                                    .setColor("#cf0202");
                                await errorChannel.send(invalidVerificationAttemptEmbed);
                                await DMChannel.send("Please respond with a correct answer: `done` or `stop` / `abort`.");
                            }
                        } else {
                            let invalidVerificationAttemptEmbed = new Discord.MessageEmbed()
                                .addField("Invalid Input", "User " + message.member.toString() + " (" + message.author.username + ") tried to tell the bot '" + responseMessage.content + "' instead of done in any capitalization.")
                                .setFooter("User ID: " + message.member.id)
                                .setColor("#cf0202");
                            await errorChannel.send(invalidVerificationAttemptEmbed);
                            await DMChannel.send("Please respond with a correct answer: `done` or `stop` / `abort`.");
                        }
                    });

                    DMMessageCollector.on("end", async (collected, reason) => {
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
                    lanisBot.activeVerificationCount -= 1
                    await activeVerificationStatusMessage.delete().catch(e => {
                        console.log(e);
                    })

                    clearInterval(updateTimeLeft);
                    await DMMessageCollector.stop();
                    let noPerms = false;
                    const raiderRole = message.guild.roles.find(role => role.id === Roles.verifiedRaider.id);
                    await message.member.setNickname(inGameName, "Accepted into the server via Automatic Verification.").catch(async e => {
                        noPerms = true;
                        await errorChannel.send("User " + message.member.toString() + " (" + message.author.username + ") tried to succesfully verify but the bot didn't have permissions to verify them.");
                        return await DMChannel.send("The bot doesn't have permissions to set your nickname, thus removing your pending application.");
                    });
                    await message.member.roles.add(raiderRole, "Accepted into the server via Automatic Verification.").catch(async e => {
                        noPerms = true;
                        await errorChannel.send("User " + message.member.toString + " (" + message.author.username + ") tried to succesfully verify but the bot didn't have permissions to verify them.");
                        return await DMChannel.send("The bot doesn't have permissions to set your role, thus removing your pending application.");
                    });

                    lanisBot.database.run(`DELETE FROM pending WHERE ID = '${message.author.id}'`)

                    await message.delete().catch(e => {
                        console.log(e);
                    })

                    if (noPerms) return;
                    let successfulVerificationEmbed = new Discord.MessageEmbed()
                        .setFooter("User ID: " + message.member.id)
                        .setColor("3ea04a");

                    successfulVerificationEmbed.addField("Successful Verification ", "User " + message.member.toString() + " (" + message.author.username + ") got successfully verified.");
                    await errorChannel.send(successfulVerificationEmbed);
                    await veriCodeEmbed.setFooter("The Verification process is completed.");
                    await veriCodeMessage.edit(veriCodeEmbed);
                    await DMChannel.send("Verification is successful, welcome to Public Lost Halls!\nWe're pleased to have you here. Before you start, we do expect all of our user to check our rules and guidelines, found in <#482368517568462868> (Apply both in discord and in-game) and <#379504881213374475> (Which only apply in game). Not knowing these rules or not reading them will not be an excuse for further suspensions, so if you can't understand anything, please don't be afraid asking staff members or members of the community.\n\nWe also have a quick start guide, which can be found in <#482394590721212416>, regarding how to join runs properly, finding the invite link for the server, and where the Raid Leader applications are.\n\nAny doubts, don't be afraid to ask any Staff member to clarify any doubts you may have.");
                    let successfulVerificationLogEmbed = new Discord.MessageEmbed()
                        .setFooter("User ID: " + message.member.id)
                        .setColor("3ea04a")
                        .addField("Successful Verification", "The bot has verified a member " + message.author.toString() + " with the in game name of '" + inGameName + "'\n[Player Profile](https://www.realmeye.com/player/" + inGameName + ")");
                    await lanisBot.channels.get(Channels.verificationsLog.id).send(successfulVerificationLogEmbed);
                    if (!memberIsVerified) {
                        lanisBot.database.run(`INSERT INTO verified(ID, name) VALUES('${message.author.id}', '${inGameName.toUpperCase()}')`)
                    }
                }).catch(async (e) => {
                    lanisBot.activeVerificationCount -= 1
                    await activeVerificationStatusMessage.delete().catch(e => {
                        console.log(e);
                    })
                    await DMMessageCollector.stop();

                    lanisBot.database.run(`DELETE FROM pending WHERE ID = '${message.author.id}'`)

                    let verificationDoneEmbed = new Discord.MessageEmbed()
                        .setFooter("User ID: " + message.member.id);
                    if (isAlt) {

                        verificationDoneEmbed.addField("Suspected Alt Found", "User " + message.member.toString() + " (" + message.author.username + ") tried to verify but were suspected to be an alt.")
                            .setColor("3ea04a");
                        await DMChannel.send("There was a problem verifying your account. Please wait for a manual verification to be done by the staff. This is will take 2-3 hours usually, 48 hours if the world is about to end or some emergency is present. Don't message staff about it, as the verification will be looked at eventually, thanks :)");
                    } else {
                        verificationDoneEmbed.addField("Verification Stopped", "User " + message.member.toString() + " (" + message.author.username + ") tried to verify but their verification was stopped.")
                            .setColor("#cf0202");
                        await DMChannel.send("The Verification process is now stopped.");
                    }
                    clearInterval(updateTimeLeft);
                    await veriCodeEmbed.setFooter("The Verification process is stopped.");
                    await veriCodeMessage.edit(veriCodeEmbed);
                    await errorChannel.send(verificationDoneEmbed);
                    await message.delete().catch(error => {
                        console.log(e)
                    });
                    return;
                });
            })
        })
    })

    async function verifyMember(inGameName) {
        let blacklistedGuilds = [];
        let oldAccount = false;
        let starCount = 0;
        let maxCharCount = 0;
        let isInBlacklistedGuild = false;
        let isBlacklisted = false;
        let fameCount = 0;
        let errorMessages = [];
        let reportMessages = [];
        let deaths;
        await axios.get("https://www.realmeye.com/player/" + inGameName, { headers: { 'User-Agent': 'Public Halls (LHS) Verification Bot' } }).then(async response => {
            if (response.status === 200) {
                const htmlData = response.data;
                const $ = cheerio.load(htmlData);

                const playerName = $('.entity-name').text();
                if (playerName.toUpperCase() !== inGameName.toUpperCase()) {
                    const invalidProfileEmbed = new Discord.MessageEmbed()
                        .setColor("cf0202")
                        .addField("Invalid Profile", "User " + message.member.toString() + " (" + message.author.username + ") tried to verify with an invalid / hidden Realmeye profile.");
                    await errorChannel.send(invalidProfileEmbed);
                    return await DMChannel.send("Member not found, please make sure your RealmEye profile isn't private or that the input name is correct (The Current Input is: '" + inGameName + "').");
                }

                let descriptionLines = [];
                $('.description-line').each(function (i, elem) {
                    descriptionLines[i] = $(this).text()
                });

                let codeFound = false;
                for (const descriptionLine of descriptionLines) {
                    if (descriptionLine.includes(veriCode)) codeFound = true;
                }

                if (!codeFound) {
                    //errorMessages.push("Cannot find the generated VeriCode in the description of the specified member.");
                }

                const characterCount = $('.active').text().replace(/[^0-9]/g, '');
                if (characterCount < 1) {
                    errorMessages.push("Can't find any characters of the profile '" + inGameName + "', make sure they aren't hidden.");
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
                } else if (!firstSeen.includes("minutes") && !firstSeen.includes("days") && !firstSeen.includes("day")) {
                    errorMessages.push("Your creation date is hidden, please unprivate it.")
                } else {
                    reportMessages.push("The account has a hidden creation date or is less than a year old.");
                }

                starCount = $(".star-container").text();
                if (!starCount) {
                    errorMessages.push("Your stars are hidden, please unprivate them.");
                } else if (starCount < 30) {
                    reportMessages.push("The account has less than 30 stars.");
                }

                const lastLocation = $('.timeago').text();
                if (lastLocation) {
                    errorMessages.push("Your last seen location is not set to hidden, please hide it.");
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

                lanisBot.database.all(`SELECT * FROM expelledGuilds`, async (err, rows) => {
                    blacklistedGuilds = rows.map(row => row.name)
                    if (currentGuild) {
                        if (blacklistedGuilds.includes(currentGuildFixed)) {
                            isInBlacklistedGuild = true;
                            reportMessages.push("Is in a blacklisted guild. (" + currentGuild + ")");
                        }
                    } else {
                        reportMessages.push("Couldn't find guild or guild is private.");
                    }

                    await axios.get('https://www.realmeye.com/name-history-of-player/' + inGameName, { headers: { 'User-Agent': 'Public Halls (LHS) Verification Bot' } })
                        .then(async response => {
                            if (response.status === 200) {
                                const html = response.data;
                                const $ = cheerio.load(html);

                                let previousNames = [];
                                $('#e tbody tr').each(function () {
                                    previousNames.push($(this).children().first().text())
                                })

                                if (previousNames.length === 0) {
                                    let errorMessage = $('h3').text();
                                    if (errorMessage === "Name history is hidden") {
                                        errorMessages.push("Your name history is hidden, please unprivate it.")
                                    } else {
                                        reportMessages.push("Has no previous names.")
                                    }
                                }

                                lanisBot.database.all(`SELECT * FROM expelled`, async (err, rows) => {
                                    let expelledPeople = rows.map(row => row.name)
                                    let foundNames = []
                                    for (const previousName of previousNames) {
                                        if (expelledPeople.includes(previousName)) {
                                            isBlacklisted = true;
                                            if (!foundNames.includes(previousName)) {
                                                foundNames.push(previousName)
                                                reportMessages.push("Member has a blacklisted name in their name history: " + previousName);
                                            }
                                        }
                                    }
                                })
                            }
                        })
                        .catch(async e => {
                            console.log(e);
                            await errorChannel.send("User " + message.member.toString() + " (" + message.author.username + ") tried to verify but the bot failed to fetch the name history page on RealmEye.");
                            await DMChannel.send("Timed out when trying to read your name history, please try again.");
                        })
                })
            }

            await axios.get("https://www.realmeye.com/graveyard-summary-of-player/" + inGameName, { headers: { 'User-Agent': 'Public Halls (LHS) Verification Bot' } }).then(async response => {
                if (response.status === 200) {
                    const html = response.data;
                    const $ = cheerio.load(html);

                    let errorMessage = $('h3').text();
                    if (errorMessage === "The graveyard of " + inGameName + " is hidden.") {
                        deaths = "hidden"
                    } else if (errorMessage === "No data available yet." || errorMessage === "Data for this account has not been migrated. Some dead characters will not be available.") {
                        deaths = "error"
                    } else {
                        deaths = $('td').last().text()
                    }
                }
            }).catch(async e => {
                console.log(e);
                await errorChannel.send("User " + message.member.toString() + " (" + message.author.username + ") tried to verify but the bot failed to fetch the graveyard history page on RealmEye.");
                errorMessages.push("Timed out while trying to read your graveyard history, please try again.")
            });

            console.log(deaths)
            if (deaths === "hidden") {
                errorMessages.push("Your graveyard is hidden, please unprivate it.")
            } else if (deaths < 100) {
                reportMessages.push("The player has less than 100 deaths.");
            } else if (!deaths >= 100) {
                reportMessages.push("No Data for the deaths of the player.")
            }

            await axios.get('https://www.realmeye.com/guild-history-of-player/' + inGameName, { headers: { 'User-Agent': 'Public Halls (LHS) Verification Bot' } })
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
                            let errorMessage = $('h3').text();
                            if (errorMessage === "Guild history is hidden") {
                                errorMessages.push("Your guild history is hidden, please unprivate it.")
                            } else {
                                reportMessages.push("Has no previous guilds.")
                            }
                        }

                        let foundGuilds = []
                        for (const previousName of previousNames) {
                            if (blacklistedGuilds.includes(previousName)) {
                                isInBlacklistedGuild = true;
                                if (!foundGuilds.includes(previousName)) {
                                    foundGuilds.push(previousName)
                                    reportMessages.push("Member has been in a blacklisted guild before: " + previousName);
                                }
                            }
                        }
                    }
                })
                .catch(async e => {
                    await errorChannel.send("User " + message.member.toString() + " (" + message.author.username + ") tried to verify but the bot failed to fetch the guild history page on RealmEye.");
                    console.log(e);
                    errorMessages.push("Timed out when trying to read your guild history, please try again.");
                })

            if (errorMessages.length !== 0) {
                let errorReport = "";
                for (const errorMessage of errorMessages) {
                    errorReport = errorReport + errorMessage + "\n"
                }
                let errorEmbed = new Discord.MessageEmbed()
                    .addField("Problems While Verifying", errorReport)
                    .setFooter("If you recently changed this give the bot a minute to renew your page.")
                    .setColor('#337b0a')
                    .setTimestamp()
                await DMChannel.send(errorEmbed);

                let verificationProblemsEmbed = new Discord.MessageEmbed()
                    .setFooter("User ID: " + message.member.id)
                    .setColor("#cf0202");
                verificationProblemsEmbed.addField("Problems While Verifying", "User " + message.member.toString() + " (" + message.author.username + ") tried to verify and had these problems:\n" + errorReport);
                await errorChannel.send(verificationProblemsEmbed);
            } else if (maxCharCount < 3 || fameCount < 1000 || starCount < 30 || deaths < 100 || oldAccount === false || isBlacklisted || isInBlacklistedGuild) {
                let reportMessage = "";
                for (const errorMessage of reportMessages) {
                    reportMessage = reportMessage + errorMessage + "\n";
                }
                reportMessage = reportMessage + "[Player Profile](https://www.realmeye.com/player/" + inGameName + ")";

                let reportEmbed = new Discord.MessageEmbed()
                    .setColor("#940000")
                    .setDescription(message.member.toString() + " trying to verify as: " + inGameName)
                    .addField("Problems: ", reportMessage)
                    .setTimestamp()

                const verificationsManual = lanisBot.channels.get(Channels.verificationsManual.id)
                const altReportMessage = await verificationsManual.send(reportEmbed);
                await altReportMessage.react("🔑")
                await altReportMessage.pin();
                const systemMesssages = await verificationsManual.messages.fetch({ after: altReportMessage.id }).catch(e => { console.log(e) });
                for (let message of systemMesssages.values()) {
                    if (message.system) {
                        await message.delete().catch(e => {
                            console.log(e);
                        })
                    }
                }

                DMMessageCollector.stop("STOP");
            } else {
                DMMessageCollector.stop("CONTINUE");
            }
        }).catch(async e => {
            await errorChannel.send("User " + message.member.toString() + " (" + message.author.username + ") tried to verify and there was a problem sending a request to their RealmEye page.");
            console.log(e);
            return await DMChannel.send("Timed out while trying to verify, please try again.");
        });
    }

    async function rejectCommand(reason, errorDescription) {
        let errorEmbed = new Discord.MessageEmbed()
            .setColor("#cf0202")
            .addField(`Invalid Action`, errorDescription)
            .setFooter("User ID: " + message.member.id)

        await lanisBot.channels.get(Channels.verificationAttempts.id).send(errorEmbed)
        const errorMessage = await message.channel.send(reason)
        await sleep(10000)
        await message.delete().catch(e => {
            console.log(e);
        })
        await errorMessage.delete().catch(e => {
            console.log(e);
        })
    }
}

module.exports.help = {
    name: "verify",
    category: "Server Management",
    example: "`-verify [RotMG Name]`",
    explanation: "Starts the verification process for a user."
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