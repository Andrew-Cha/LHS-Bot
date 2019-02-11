const Discord = require(`discord.js`)
const fileSystem = require(`fs`);
const sqlite3 = require(`sqlite3`).verbose()

const config = require("./dataFiles/config.json");
const Channels = require("./dataFiles/channels.json")
const Roles = require("./dataFiles/roles.json")

const lanisBot = new Discord.Client();

lanisBot.commands = new Discord.Collection();
lanisBot.database = new sqlite3.Database(`./dataFiles/database`, error => {
    if (error) {
        throw error
    }
    console.log('Connected to the in-memory SQlite3 database.')
})
lanisBot.options.fetchAllMembers = true
lanisBot.activeVerificationCount = 0
lanisBot.setMaxListeners(100);

let antiflood = new Set();
let antifloodTime = 1;  // in seconds

fileSystem.readdir("./commands", (e, files) => {
    if (e) console.log(e);

    //JavaSript files only
    let filteredFiles = files.filter(f => f.split(".").pop() === "js");

    if (filteredFiles.length <= 0) {
        console.log("Folder not found or zero length (empty)");
        return;
    }

    filteredFiles.forEach((f, i) => {
        let file = require(`./commands/${f}`);
        console.log(`${f} command loaded.`);
        lanisBot.commands.set(file.help.name.toUpperCase(), file);
    });
});

lanisBot.on("error", console.error);

lanisBot.on("message", async message => {
    if (message.author.bot) return
    if (message.content === null) return
    let prefix = config.prefix;

    let messageArray = message.content.match(/\S+/g)
    if (messageArray === null) return
    let command = messageArray[0]
    let args = messageArray.slice(1)

    if (command.slice(prefix.length).toUpperCase() === "STATS" && message.channel.id !== Channels.verificationsAutomatic) {
        if (command.indexOf(config.prefix) !== 0) return
        let commandFile = lanisBot.commands.get("STATS");
        if (commandFile) commandFile.run(lanisBot, message, args);
        return;
    } else if (command.slice(prefix.length).toUpperCase() === "LEADERBOARD" && message.channel.id !== Channels.verificationsAutomatic) {
        if (command.indexOf(config.prefix) !== 0) return
        let commandFile = lanisBot.commands.get("LEADERBOARD");
        if (commandFile) commandFile.run(lanisBot, message, args);
        return;
    }

    if (message.channel.type === "dm") {
        let messageContent = message.content
        if (messageContent.toUpperCase() === "DONE" || messageContent.toUpperCase() === "YES" || messageContent.toUpperCase() === "NO" || messageContent.toUpperCase() === "ABORT" || messageContent.toUpperCase() === "STOP") return
        const guild = lanisBot.guilds.get("343704644712923138");
        const historyDMs = await guild.channels.get(Channels.historyDMs.id)

        let memberExpelled = false
        lanisBot.database.get(`SELECT * FROM feedbackBlacklist WHERE ID = '${message.author.id}'`, async (error, row) => {
            if (error) {
                throw error
            }

            if (row !== undefined) memberExpelled = true

            if (memberExpelled) {
                message.react("⚠");
                return
            }

            if (messageContent.length === 0) {
                message.react("⚠");
                return
            }

            if (messageContent.length > 1000) {
                messageContent = message.content.slice(0, 1000) + "..."
            }

            const embed = new Discord.MessageEmbed()
                .setAuthor(message.author.tag, await message.author.avatarURL())
                .setColor("3ea04a")
                .setDescription(message.author.toString(), true)
                .addField("Direct Message", messageContent)
                .setFooter("User ID: " + message.author.id)
                .setTimestamp()

            message.react("📧")
            const messageSent = await historyDMs.send(embed)
            await messageSent.react("🔑")

            const reportMessage = await message.channel.send("Message sent to modmail, if this was an accident, don't worry.")
            await sleep(10000)
            await reportMessage.delete()
        })
        return;
    }

    let permittedChannels = []
    for (const index in Channels.botCommands.id) {
        permittedChannels.push(Channels.botCommands.id[index])
    }
    permittedChannels.push(Channels.verificationsAutomatic.id)

    if (!permittedChannels.includes(message.channel.id) && command.toUpperCase() !== config.prefix + "PURGE" && command.toUpperCase() !== config.prefix + "VERIFY") return

    if (antiflood.has(message.author.id) && message.content !== "-yes" && message.content !== "-no" && message.channel.id !== Channels.verificationsAutomatic.id) {
        message.delete();
        return message.reply(`You must wait ${antifloodTime} seconds before sending another command.`);
    }

    const devRole = message.guild.roles.find(role => role.id === Roles.developer.id);
    if (message.channel.id === Channels.verificationsAutomatic.id && command.toUpperCase() !== config.prefix + "VERIFY" && message.member.roles.highest.position < devRole.position) {
        let errorEmbed = new Discord.MessageEmbed()
            .addField("Invalid Input", "User " + message.member.toString() + " (" + message.author.username + ") sent an invalid message in <#471711348095713281> : '" + message.content + "'")
            .setFooter("User ID: " + message.member.id)
            .setColor("#cf0202");
        await lanisBot.channels.get(Channels.verificationAttempts.id).send(errorEmbed);

        let errorMessage;
        if (message.content.toUpperCase() === "DONE" || message.content.toUpperCase() === "STOP" || message.content.toUpperCase() === "ABORT") {
            errorMessage = await message.channel.send("Send this input to the conversation you have with the bot, not here.");
        } else {
            errorMessage = await message.channel.send("Please input the verification command correctly.");
        }
        await sleep(10000);
        await errorMessage.delete()
        return await message.delete();
    }

    if (command.indexOf(config.prefix) !== 0) return
    let commandFile = lanisBot.commands.get(command.slice(prefix.length).toUpperCase());
    if (commandFile) commandFile.run(lanisBot, message, args);

    antiflood.add(message.author.id);

    setTimeout(() => {
        antiflood.delete(message.author.id)
    }, antifloodTime * 1000)
});

lanisBot.on('messageReactionAdd', async (reaction, user) => {
    if (reaction === undefined) return;
    if (reaction.message.channel.type !== "text") return;
    const reactionMessage = await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error);
    if (reactionMessage === undefined) return;
    const reactionChannel = reactionMessage.channel;
    const verifier = await reactionMessage.guild.members.fetch(user.id);
    if (user.bot) return;

    if (reactionChannel.id === Channels.historyDMs.id) {
        if (reaction.emoji.name === "🔑" || reaction.emoji.name === "↩") {
            await reactionMessage.reactions.removeAll();
            await reactionMessage.react("✅");
            await reactionMessage.react("❌");
            await reactionMessage.react("🔨");
            await reactionMessage.react("🔒");
        } else if (reaction.emoji.name === "✅") {
            await reactionMessage.reactions.removeAll()
            await reactionMessage.react("📧")
            await reactionMessage.react("👀")
            await reactionMessage.react("↩")
        } else if (reaction.emoji.name === "🔒") {
            await reactionMessage.reactions.removeAll();
            await reactionMessage.react("🔑");
        } else if (reaction.emoji.name === "❌") {
            reactionMessage.delete()
        } else if (reaction.emoji.name === "🔨") {
            let memberVerified = false;
            let memberID = reaction.message.embeds[0].footer.text.split(":")[1].trim()
            const member = await reactionMessage.guild.members.fetch(memberID).catch()
            lanisBot.database.get(`SELECT * FROM feedbackBlacklist WHERE ID = '${memberID}'`, async (error, row) => {
                if (error) {
                    throw error
                }
                if (row !== undefined) memberVerified = true
                if (!memberVerified) {
                    lanisBot.database.run(`INSERT INTO feedbackBlacklist(ID) VALUES('${memberID}')`)
                }

                if (memberVerified) {
                    reactionMessage.channel.send(`${user.toString()}, ${member.toString()} is already added to the feedback blacklist.`)
                    return
                }
                await reactionMessage.reactions
                await reactionMessage.reactions.removeAll()
                await reactionMessage.react("👋");
            })
        } else if (reaction.emoji.name === "👀") {
            await reactionMessage.reactions.removeAll()
            reactionMessage.react("👍")
        } else if (reaction.emoji.name === "📧") {
            let memberID = reaction.message.embeds[0].footer.text.split(":")[1].trim()
            let memberFound = true
            const member = await reactionMessage.guild.members.fetch(memberID).catch(e => {
                memberFound = false
            })
            if (memberFound) {
                const responseStatusEmbed = new Discord.MessageEmbed()
                    .setColor("#4286f4")
                    .setDescription(`Response for <@${memberID}> by <@${user.id}>`)
                    .addField("Response Status: ", "No Input Yet")
                    .setFooter("Time Left: 5 minutes 0 seconds.")

                const responseStatusMessage = await reactionChannel.send(responseStatusEmbed)

                let responseMessage = "No Input"
                let waitingForConfirmation = false

                const filter = message => {
                    if (waitingForConfirmation) return false
                    if (message.author.id !== user.id) return false
                    return true
                }
                const confirmationFilter = (confirmationMessage) => confirmationMessage.content !== "" && confirmationMessage.author.bot === false;

                const responseCollector = new Discord.MessageCollector(reactionChannel, filter, { time: 300000 });

                responseCollector.on("collect", async message => {
                    if (!waitingForConfirmation) {
                        if (message.content.length === 0) {
                            await reactionChannel.send("The message has to include text content.")
                        } else if (message.content.length <= 1000) {
                            await new Promise(async (resolve, reject) => {
                                waitingForConfirmation = true

                                await reactionChannel.send(`Are you sure this is what you want to respond with to <@${memberID}>?:\n${message.content}`)

                                const confirmationCollector = await reactionChannel.createMessageCollector(confirmationFilter, { time: 60000 });
                                confirmationCollector.on("collect", async (confirmationMessage, user) => {
                                    if (confirmationMessage.content.toUpperCase() === "-YES") {
                                        confirmationCollector.stop("CONTINUE");
                                    } else if (confirmationMessage.content.toUpperCase() === "-NO") {
                                        confirmationCollector.stop("STOP");
                                    } else if (confirmationMessage.content.toUpperCase() === "-STOP") {
                                        confirmationCollector.stop("STOP")
                                    } else {
                                        await reactionChannel.send("Please respond with a correct answer: `-yes`, `-no` or `-stop`.");
                                    }
                                });

                                confirmationCollector.on("end", async (collected, reason) => {
                                    if (reason === "CONTINUE") {
                                        resolve("SUCCESS");
                                    } else if (reason === "STOP" || reason === "time") {
                                        reject("FAILURE");
                                    }
                                })
                            }).then(async => {
                                responseMessage = message.content
                                responseStatusEmbed.fields[0] = { name: "Response Status:", value: responseMessage }
                                responseCollector.stop("responded")
                            }).catch(async => {
                                reactionChannel.send("Not sending the current message.")
                                waitingForConfirmation = false
                            });
                        } else {
                            await reactionChannel.send("Sorry, the message has to be shorter or equal to 1000 characters, please make it shorter.")
                        }
                    }
                })


                let timeTotal = responseCollector.options.time;
                const updateResponseStatusMessage = setInterval((async => {
                    if (timeTotal < 0) { clearInterval(updateResponseStatusMessage) }
                    timeTotal -= 10000;
                    const minutesLeft = Math.floor(timeTotal / 60000);
                    const secondsLeft = Math.floor((timeTotal - minutesLeft * 60000) / 1000);
                    responseStatusEmbed.setFooter(`Time Left: ${minutesLeft} minutes ${secondsLeft} seconds.`)
                    responseStatusMessage.edit(responseStatusEmbed)
                }), 10000)

                responseCollector.on("end", async (messages, reason) => {
                    clearInterval(updateResponseStatusMessage)
                    if (reason === "time") {
                        await reactionChannel.send(`<@${user.id}>, the response message for <@${memberID}> is no longer being formed. This is what you had as your last input:\n${confirmationMessage}`)
                    } else {
                        responseStatusEmbed.setFooter("Message Sent")
                        responseStatusEmbed.setTimestamp()
                        responseStatusMessage.edit(responseStatusEmbed)
                        member.send(responseMessage)
                        await reactionMessage.reactions.removeAll()
                        await reactionMessage.react("📫")
                    }
                })
            } else {
                reactionChannel.send(`Can't find <@${memberID}> in the server, thus not continuing.`)
            }
        }
    }

    if (reactionChannel.id === Channels.verificationsEvents.id) {
        const member = await reactionMessage.guild.members.fetch(user.id);
        const eventRole = reactionMessage.guild.roles.find(role => role.id === Roles.events.id);
        let addedToAntiFlood = false; //needed to we can check if we should send the message the first time they react.

        if (!antiflood.has(member.id)) {
            antiflood.add(member.id);
            addedToAntiFlood = true;

            setTimeout(() => {
                antiflood.delete(member.id);
            }, antifloodTime * 1000 * 10)
        }
        if (reaction.emoji.name === "✅") {
            if (member.roles.find(role => role.id === Roles.events.id === true)) {
                if (addedToAntiFlood) {
                    const errorMessage = await reactionChannel.send(member.toString() + ", you already have the events role.");
                    await sleep(10000);
                    await errorMessage.delete()
                }
            } else {
                await member.roles.add(eventRole);
                if (addedToAntiFlood) {
                    const successMessage = await reactionChannel.send(member.toString() + ", gave you the events role.");
                    await sleep(10000);
                    await successMessage.delete()
                }
            }
        } else if (reaction.emoji.name === "❌") {
            if (member.roles.find(role => role.id === Roles.events.id === true)) {
                await member.roles.remove(eventRole);
                if (addedToAntiFlood) {
                    const successMessage = await reactionChannel.send(member.toString() + ", removed your event role.");
                    await sleep(10000);
                    await successMessage.delete()
                }
            } else {
                if (addedToAntiFlood) {
                    const errorMessage = await reactionChannel.send(member.toString() + ", you don't have the event role.");
                    await sleep(10000);
                    await errorMessage.delete()
                }
            }
        }
    }

    if (reactionChannel.id === Channels.verificationsManual.id) {
        if (reaction.emoji.name === "🔑" || reaction.emoji.name === "↩") {
            await reactionMessage.reactions.removeAll();
            await reactionMessage.react("✅");
            await reactionMessage.react("❌");
            await reactionMessage.react("🔒");
        } else if (reaction.emoji.name === "🔒") {
            await reactionMessage.reactions.removeAll();
            await reactionMessage.react("🔑");
        } else if (reaction.emoji.name === "❌") {
            await reactionMessage.reactions.removeAll();
            await reactionMessage.react('1⃣'); //one
            await reactionMessage.react('2⃣'); //two
            await reactionMessage.react('3⃣'); //three
            await reactionMessage.react('4⃣'); //four
            await reactionMessage.react('5⃣'); //five
            await reactionMessage.react("↩"); //back arrow
        } else if (reaction.emoji.name === "✅") {
            const memberVerifyingTag = reactionMessage.embeds[0].description.split(' ')[0];
            const memberVerifyingID = memberVerifyingTag.match(/<@!?(1|\d{17,19})>/)[1];
            const accountName = reactionMessage.embeds[0].description.split(': ')[1];
            const memberVerifying = await reactionMessage.guild.members.fetch(memberVerifyingID).catch(async e => {
                console.log(e)
                return reactionChannel.send(verifier.toString() + ", " + accountName + " has left the server, please reject them using 5⃣")
            })

            let noPerms = false
            const raiderRole = reactionMessage.guild.roles.find(role => role.id === Roles.verifiedRaider.id);
            await memberVerifying.setNickname(accountName, "Accepted into the server via Manual Verification.").catch(async e => {
                noPerms = true;
                await reactionChannel.send("The bot doesn't have permissions to set " + memberVerifying.toString() + "'s nickname, thus removing their pending application.");
            });
            await memberVerifying.roles.add(raiderRole, "Accepted into the server via Manual Verification.").catch(async e => {
                console.log(e);
                noPerms = true;
                await reactionChannel.send("The bot doesn't have permissions to set " + memberVerifying.toString() + "'s role, thus removing their pending application.");
            });

            if (memberVerifying !== undefined) {
                lanisBot.database.get(`SELECT * FROM pending WHERE ID = '${memberVerifying.id}'`, async (error, row) => {
                    if (error) {
                        throw error
                    }
                    if (row !== undefined) {
                        lanisBot.database.run(`DELETE FROM pending WHERE ID = '${memberVerifying.id}'`)
                    }
                })
            }

            lanisBot.database.get(`SELECT * FROM expelled WHERE name = '${accountName.toUpperCase()}'`, async (error, row) => {
                if (error) {
                    throw error
                }
                if (row !== undefined) {
                    lanisBot.database.run(`DELETE FROM expelled WHERE name = '${accountName.toUpperCase()}'`)
                }
            })

            if (noPerms) {
                await reactionMessage.reactions.removeAll();
                await reactionMessage.react("⚠");
                return;
            }

            let successfulVerificationLogEmbed = new Discord.MessageEmbed()
                .setFooter("User ID: " + memberVerifying)
                .setColor("3ea04a")
                .addField("Successful Verification", verifier.toString() + " has verified a member " + memberVerifying.toString() + " with the in game name of '" + accountName + "'\n[Player Profile](https://www.realmeye.com/player/" + accountName + ")");
            await lanisBot.channels.get(Channels.verificationsLog.id).send(successfulVerificationLogEmbed);
            await reactionMessage.reactions.removeAll();
            let reactionMessageEmbed = reactionMessage.embeds[0]
            reactionMessageEmbed.footer = { text: "Verified by " + verifier.displayName }
            await reactionMessage.edit(reactionMessageEmbed)
            await reactionMessage.react("💯");
            if (reactionMessage.pinned) {
                await reactionMessage.unpin();
            }
            await memberVerifying.send("You have been accepted to Public Lost Halls!\nWe're pleased to have you here. Before you start, we do expect all of our user to check our rules and guidelines, found in <#482368517568462868> (Apply both in discord and in-game) and <#379504881213374475> (Which only apply in game). Not knowing these rules or not reading them will not be an excuse for further suspensions, so if you can't understand anything, please don't be afraid asking staff members or members of the community.\n\nWe also have a quick start guide, which can be found in <#482394590721212416>, regarding how to join runs properly, finding the invite link for the server, and where the Raid Leader applications are.\n\nAny doubts, don't be afraid to ask any Staff member to clarify any doubts you may have.");

            let memberVerified = false;
            lanisBot.database.get(`SELECT * FROM verified WHERE name = '${accountName.toUpperCase()}' OR ID = '${memberVerifying.id}'`, async (error, row) => {
                if (error) {
                    throw error
                }
                if (row !== undefined) memberVerified = true
                if (!memberVerified) {
                    lanisBot.database.run(`INSERT INTO verified(ID, name) VALUES('${memberVerifying.id}', '${accountName.toUpperCase()}')`)
                }
            })
        } else if (reaction.emoji.name === '1⃣' || reaction.emoji.name === '2⃣' || reaction.emoji.name === '4⃣') {
            const memberVerifyingTag = reactionMessage.embeds[0].description.split(', ')[0];
            const memberVerifyingID = memberVerifyingTag.match(/<@!?(1|\d{17,19})>/)[1];
            const memberVerifying = await reactionMessage.guild.members.fetch(memberVerifyingID);
            const playerToExpel = reactionMessage.embeds[0].description.split(': ')[1];

            lanisBot.database.get(`SELECT * FROM expelled WHERE name = '${playerToExpel.toUpperCase()}'`, async (error, row) => {
                if (error) {
                    throw error
                }
                if (row !== undefined) {
                    return await reactionMessage.channel.send(playerToExpel + " is already expelled, " + verifier.toString());
                } else {
                    lanisBot.database.run(`INSERT INTO expelled(name) VALUES('${playerToExpel.toUpperCase()}')`, (error, row) => {
                        if (error) {
                            throw error
                        }
                    })
                }
            })

            let failedVerificationLogEmbed = new Discord.MessageEmbed()
                .setFooter("User ID: " + memberVerifyingID)
                .setColor("#cf0202")

            if (reaction.emoji.name === '1⃣') {
                failedVerificationLogEmbed.addField("Application Rejected", "Player " + playerToExpel + "(" + memberVerifying.toString() + ") was expelled by " + verifier.toString() + " due to being a suspected mule.");
                await memberVerifying.send("Your account was suspected to be a mule, please contact <@" + user.id + "> to appeal.");
            } else if (reaction.emoji.name === '2⃣') {
                failedVerificationLogEmbed.addField("Application Rejected", "Player " + playerToExpel + "(" + memberVerifying.toString() + ") was expelled by " + verifier.toString() + " due to being in a blacklisted guild.");
                await memberVerifying.send("Your account is in a blacklisted guild, please contact <@" + user.id + "> to appeal.");
            } else {
                failedVerificationLogEmbed.addField("Application Rejected", "Player " + playerToExpel + "(" + memberVerifying.toString() + ") was expelled by " + verifier.toString() + " using silent expulsion.");
            }
            await lanisBot.channels.get(Channels.verificationsLog.id).send(failedVerificationLogEmbed);

            if (memberVerifying !== undefined) {
                lanisBot.database.get(`SELECT * FROM pending WHERE ID = '${memberVerifying.id}'`, async (error, row) => {
                    if (error) {
                        throw error
                    }
                    if (row !== undefined) {
                        lanisBot.database.run(`DELETE FROM pending WHERE ID = '${memberVerifying.id}'`)
                    }
                })
            }

            await reactionMessage.reactions.removeAll();
            let reactionMessageEmbed = reactionMessage.embeds[0]
            reactionMessageEmbed.footer = { text: "Rejected by " + verifier.displayName }
            await reactionMessage.edit(reactionMessageEmbed)
            await reactionMessage.react("🔨");
            if (reactionMessage.pinned) {
                await reactionMessage.unpin();
            }
        } else if (reaction.emoji.name === '3⃣' || reaction.emoji.name === '5⃣') {
            const memberVerifyingTag = reactionMessage.embeds[0].description.split(', ')[0];
            const memberVerifyingID = memberVerifyingTag.match(/<@!?(1|\d{17,19})>/)[1];
            const memberVerifying = await reactionMessage.guild.members.fetch(memberVerifyingID).catch(e => { console.log(e) });

            const playerToExpel = reactionMessage.embeds[0].description.split(': ')[1];
            lanisBot.database.get(`SELECT * FROM expelled WHERE name = '${playerToExpel.toUpperCase()}'`, async (error, row) => {
                if (error) {
                    throw error
                }

                if (memberVerifying !== undefined) {
                    lanisBot.database.get(`SELECT * FROM pending WHERE ID = '${memberVerifying.id}'`, async (error, row) => {
                        if (error) {
                            throw error
                        }
                        if (row !== undefined) {
                            lanisBot.database.run(`DELETE FROM pending WHERE ID = '${memberVerifying.id}'`)
                        }
                    })
                } else if (reaction.emoji.name === '3⃣') {
                    return reactionMessage.channel.send(`<@${user.id}>, <@${memberVerifyingID}> has left the server, reject them using :five:`)
                }

                let failedVerificationLogEmbed = new Discord.MessageEmbed()
                    .setFooter("User ID: " + memberVerifyingID)
                    .setColor("#d5d827")

                if (reaction.emoji.name === '3⃣') {
                    failedVerificationLogEmbed.addField("Application Removed", "Player " + playerToExpel + "(" + memberVerifying.toString() + ") was told to reapply by " + verifier.toString() + " due to having too many pages privated.");
                    await memberVerifying.send("Please unprivate **everything** on realmeye except your last seen location and apply again.");
                } else if (reaction.emoji.name === '5⃣') {
                    failedVerificationLogEmbed.addField("Application Removed", "Player " + playerToExpel + "(<@" + memberVerifyingID.toString() + ">) had their application removed by " + verifier.toString() + ".");
                }

                await lanisBot.channels.get(Channels.verificationsLog.id).send(failedVerificationLogEmbed);
                await reactionMessage.reactions.removeAll();
                let reactionMessageEmbed = reactionMessage.embeds[0]
                reactionMessageEmbed.footer = { text: "Application removed by " + verifier.displayName }
                await reactionMessage.edit(reactionMessageEmbed)
                await reactionMessage.react("👋");
                if (reactionMessage.pinned) {
                    await reactionMessage.unpin();
                }
            })
        }
    }
})

lanisBot.on('messageUpdate', async (oldMessage, newMessage) => {
    if (newMessage.channel.id === Channels.verificationsAutomatic.id) {
        const devRole = newMessage.guild.roles.find(role => role.id === Roles.security.id);
        if (newMessage.member.roles.highest.position < devRole.position) {
            newMessage.delete()
        }
    }
})

lanisBot.on('guildMemberAdd', async member => {
    lanisBot.database.get(`SELECT * FROM stats WHERE ID = '${member.id}'`, (error, row) => {
        if (row !== undefined) return;
        lanisBot.database.run(`INSERT INTO stats(ID, lostHallsKeysPopped, otherKeysPopped, cultsDone, voidsDone, otherDungeonsDone, cultsLed, voidsLed, assists, currentCultsLed, currentVoidsLed, currentAssists, vialsStored, vialsUsed, commendations, commendedBy) VALUES(${member.id}, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '')`)
    })

    lanisBot.database.get(`SELECT * FROM suspended WHERE ID = '${member.id}'`, (error, row) => {
        const guild = lanisBot.guilds.get("343704644712923138");
        if (row !== undefined) {
            if (row.time !== undefined) {
                let toBeExpelled = false

                if (row.time >= 60000000000) {
                    toBeExpelled = true
                }

                let suspendRole = toBeExpelled ? guild.roles.find(role => role.id === Roles.suspended.id) : guild.roles.find(role => role.id === Roles.suspendedButVerified.id);
                member.roles.add(suspendRole)
            }
        }
    })
})

lanisBot.on('guildMemberRemove', async member => {
    const memberRoles = member.roles;
    let isSuspended = false;
    let isRaider = false;

    for (const role of memberRoles.values()) {
        if (role.id === Roles.suspendedButVerified.id || role.id === Roles.suspended.id) {
            isSuspended = true;
        } else if (role.id === Roles.verifiedRaider.id) {
            if (!isSuspended) {
                isRaider = true;
            }
        }
    }

    if (!isSuspended && isRaider) {
        lanisBot.database.get(`SELECT * FROM verified WHERE ID = '${member.id}'`, async (error, row) => {
            if (error) {
                throw error
            }
            if (row !== undefined) {
                lanisBot.database.run(`DELETE FROM verified WHERE ID = '${member.id}'`)
            }
        })
    }
});

const events = {
    MESSAGE_REACTION_ADD: 'messageReactionAdd',
    MESSAGE_REACTION_REMOVE: 'messageReactionRemove',
};

lanisBot.on('raw', async event => {
    if (!events.hasOwnProperty(event.t)) return;
    const { d: data } = event;
    if (data.channel_id !== Channels.verificationsManual.id && data.channel_id !== Channels.verificationsEvents.id && data.channel_id !== Channels.historyDMs.id) return;
    const user = lanisBot.users.get(data.user_id);
    const channel = lanisBot.channels.get(data.channel_id);

    if (channel.messages.has(data.message_id)) return;

    const message = await channel.messages.fetch(data.message_id);
    const emojiKey = (data.emoji.id) ? `${data.emoji.name}:${data.emoji.id}` : data.emoji.name;
    const reaction = message.reactions.get(emojiKey);
    lanisBot.emit(events[event.t], reaction, user);
});

lanisBot.on("ready", async () => {
    console.log(`${lanisBot.user.username} is online!`)

    lanisBot.setInterval((async () => {
        await checkAutomaticSuspensions()
    }), 300000)

    lanisBot.setInterval((async () => {
        //The idea is to store the week of the year 1 - 52 and check if the current week stored is not the current week - end week and store the current week.
        const now = new Date();
        const januaryFirst = new Date(now.getFullYear(), 0, 1);
        const week = Math.ceil((((now - januaryFirst) / 86400000) + januaryFirst.getDay() + 1) / 7);

        if (week !== config.lastLoggedWeek) {
            let commandFile = lanisBot.commands.get("ENDWEEK");
            const message = await lanisBot.channels.get("432995686678790144").send("Ending the week automatically.")
            const args = ["automaticEnd"]
            if (commandFile) commandFile.run(lanisBot, message, args);

            config.lastLoggedWeek = week
            fileSystem.writeFile("./dataFiles/config.json", JSON.stringify(config, null, 1), async error => {
                if (error) {
                    throw error
                }
            })
        }
    }), 6000)
});



lanisBot.login(config.token);


async function checkAutomaticSuspensions() {
    lanisBot.database.serialize(() => {
        const guild = lanisBot.guilds.get("343704644712923138");
        const suspensionLogChannel = lanisBot.channels.get(Channels.suspendLog.id)

        lanisBot.database.each(`SELECT * FROM suspended`, async (error, row) => {
            if (error) {
                console.log(row)
                throw error
            }
            const ID = row.ID.toString()
            const member = await guild.members.fetch(ID).catch((err) => {
                lanisBot.database.run((`DELETE FROM suspended WHERE ID = ${row.ID}`), (error, row) => {
                    if (error) {
                        console.log(row)
                        throw error
                    }
                })
            })

            if (member !== undefined) {
                if (Date.now() > row.time) {
                    const roleNames = row.roles.split(",")
                    const roles = []
                    for (const roleName of roleNames) {
                        const currentRole = guild.roles.find(role => role.name === roleName)
                        roles.push(currentRole)
                    }

                    if (roles[0] !== undefined) {
                        await member.roles.add(roles)
                    }

                    const suspendedButVerifiedRole = guild.roles.find(role => role.id === Roles.suspendedButVerified.id)
                    if (member.roles.find(role => role.id === Roles.suspendedButVerified.id)) {
                        await member.roles.remove(suspendedButVerifiedRole);
                    }
                    const suspendedRole = guild.roles.find(role => role.id === Roles.suspended.id)
                    if (member.roles.find(role => role.id === Roles.suspended.id)) {
                        await member.roles.remove(suspendedRole);
                    }

                    lanisBot.database.run(`DELETE FROM suspended WHERE ID = ${row.ID}`)

                    await suspensionLogChannel.send(member.toString() + " you have been unsuspended.");
                }
            }
        })
    })
}

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}