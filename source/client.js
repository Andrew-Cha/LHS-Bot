
const Config = require("../data/Config.json")
const Channels = require("../data/channels.json")
const Discord = require(`discord.js`)
const FileSystem = require(`fs`)
const Roles = require("../data/roles.json")
const Sqlite3 = require(`sqlite3`).verbose()

const DatabaseExtensionModule = require(`./extensions/DatabaseExtension`)
const MessageSentHandlerModule = require(`./handlers/MessageSentHandler`)
const ReactionHandlerModule = require(`./handlers/ReactionHandler`)
const TimeoutExtensionModule = require(`./extensions/TimeoutExtension`)

module.exports = class Bot {
    constructor(client) {
        this.client = client
        this.client.prefix = Config.prefix

        this.MessageSentHandler = new MessageSentHandlerModule
        this.ReactionHandler = new ReactionHandlerModule
        new TimeoutExtensionModule(this.client).extend()
    }

    initiate() {
        console.log(`_ _ _ _ _ _ _ _ _ _`)
        //Load core
        this.loadCommands()
        this.loadDatabase()
        this.setupAntiFlood()

        this.client.on(`ready`, () => {
            console.log(`Client Online`);

            this.client.setInterval((async () => {
                await checkAutomaticSuspensions()
            }), 300000)
        
            this.client.setInterval((async () => {
                //The idea is to store the week of the year 1 - 52 and check if the current week stored is not the current week - end week and store the current week.
                const now = new Date();
                const januaryFirst = new Date(now.getFullYear(), 0, 1);
                const week = Math.ceil((((now - januaryFirst) / 86400000) + januaryFirst.getDay() + 1) / 7);
        
                if (week !== Config.lastLoggedWeek) {
                    let commandFile = this.client.commands.get("ENDWEEK");
                    const message = await this.client.channels.get("432995686678790144").send("Ending the week automatically.")
                    const args = ["automaticEnd"]
                    if (commandFile) commandFile.run(this.client, message, args);
        
                    Config.lastLoggedWeek = week
                    FileSystem.writeFile("../data/Config.json", JSON.stringify(Config, null, 1), async error => {
                        if (error) {
                            throw error
                        }
                    })
                }
            }), 6000)
        })

        this.client.on(`error`, console.error)

        this.client.on("message", async message => {
            if (message.author.bot) return
            if (message.content === null) return
            let prefix = Config.prefix;

            let messageArray = message.content.match(/\S+/g)
            if (messageArray === null) return
            let command = messageArray[0]
            let args = messageArray.slice(1)

            if (command.slice(prefix.length).toUpperCase() === "STATS" && message.channel.id !== Channels.verificationsAutomatic) {
                if (command.indexOf(Config.prefix) !== 0) return
                let commandFile = this.client.commands.get("STATS");
                if (commandFile) commandFile.run(this.client, message, args);
                return;
            } else if (command.slice(prefix.length).toUpperCase() === "LEADERBOARD" && message.channel.id !== Channels.verificationsAutomatic) {
                if (command.indexOf(Config.prefix) !== 0) return
                let commandFile = this.client.commands.get("LEADERBOARD");
                if (commandFile) commandFile.run(this.client, message, args);
                return;
            }

            if (message.channel.type === "dm") {
                let messageContent = message.content
                if (messageContent.toUpperCase() === "DONE" || messageContent.toUpperCase() === "YES" || messageContent.toUpperCase() === "NO" || messageContent.toUpperCase() === "ABORT" || messageContent.toUpperCase() === "STOP") return
                const guild = this.client.guilds.get("343704644712923138");
                const historyDMs = await guild.channels.get(Channels.historyDMs.id)

                let memberExpelled = false
                this.client.database.get(`SELECT * FROM feedbackBlacklist WHERE ID = '${message.author.id}'`, async (error, row) => {
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

            if (!permittedChannels.includes(message.channel.id) && command.toUpperCase() !== Config.prefix + "PURGE" && command.toUpperCase() !== Config.prefix + "VERIFY") return

            if (antiflood.has(message.author.id) && message.content !== "-yes" && message.content !== "-no" && message.channel.id !== Channels.verificationsAutomatic.id) {
                message.delete();
                return message.reply(`You must wait ${antifloodTime} seconds before sending another command.`);
            }

            const devRole = message.guild.roles.find(role => role.id === Roles.developer.id);
            if (message.channel.id === Channels.verificationsAutomatic.id && command.toUpperCase() !== Config.prefix + "VERIFY" && message.member.roles.highest.position < devRole.position) {
                let errorEmbed = new Discord.MessageEmbed()
                    .addField("Invalid Input", "User " + message.member.toString() + " (" + message.author.username + ") sent an invalid message in <#471711348095713281> : '" + message.content + "'")
                    .setFooter("User ID: " + message.member.id)
                    .setColor("#cf0202");
                await this.client.channels.get(Channels.verificationAttempts.id).send(errorEmbed);

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

            if (command.indexOf(Config.prefix) !== 0) return
            let commandFile = this.client.commands.get(command.slice(prefix.length).toUpperCase());
            if (commandFile) commandFile.run(this.client, message, args);

            antiflood.add(message.author.id);

            setTimeout(() => {
                antiflood.delete(message.author.id)
            }, antifloodTime * 1000)
        })

        this.client.on('messageReactionAdd', async (reaction, user) => {
            if (reaction === undefined) return;
            if (reaction.message.channel.type !== "text") return;

            const reactionMessage = await reaction.message.channel.messages.fetch(reaction.message.id).catch(console.error);
            if (reactionMessage === undefined) return;

            const reactionChannel = reactionMessage.channel;

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
                    this.client.database.get(`SELECT * FROM feedbackBlacklist WHERE ID = '${memberID}'`, async (error, row) => {
                        if (error) {
                            throw error
                        }
                        if (row !== undefined) memberVerified = true
                        if (!memberVerified) {
                            this.client.database.run(`INSERT INTO feedbackBlacklist(ID) VALUES('${memberID}')`)
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
                const verifier = await reactionMessage.guild.members.fetch(user.id);

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
                        this.client.database.get(`SELECT * FROM pending WHERE ID = '${memberVerifying.id}'`, async (error, row) => {
                            if (error) {
                                throw error
                            }
                            if (row !== undefined) {
                                this.client.database.run(`DELETE FROM pending WHERE ID = '${memberVerifying.id}'`)
                            }
                        })
                    }

                    this.client.database.get(`SELECT * FROM expelled WHERE name = '${accountName.toUpperCase()}'`, async (error, row) => {
                        if (error) {
                            throw error
                        }
                        if (row !== undefined) {
                            this.client.database.run(`DELETE FROM expelled WHERE name = '${accountName.toUpperCase()}'`)
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
                    await this.client.channels.get(Channels.verificationsLog.id).send(successfulVerificationLogEmbed);
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
                    this.client.database.get(`SELECT * FROM verified WHERE name = '${accountName.toUpperCase()}' OR ID = '${memberVerifying.id}'`, async (error, row) => {
                        if (error) {
                            throw error
                        }
                        if (row !== undefined) memberVerified = true
                        if (!memberVerified) {
                            this.client.database.run(`INSERT INTO verified(ID, name) VALUES('${memberVerifying.id}', '${accountName.toUpperCase()}')`)
                        }
                    })
                } else if (reaction.emoji.name === '1⃣' || reaction.emoji.name === '2⃣' || reaction.emoji.name === '4⃣') {
                    const memberVerifyingTag = reactionMessage.embeds[0].description.split(', ')[0];
                    const memberVerifyingID = memberVerifyingTag.match(/<@!?(1|\d{17,19})>/)[1];
                    const memberVerifying = await reactionMessage.guild.members.fetch(memberVerifyingID);
                    const playerToExpel = reactionMessage.embeds[0].description.split(': ')[1];

                    this.client.database.get(`SELECT * FROM expelled WHERE name = '${playerToExpel.toUpperCase()}'`, async (error, row) => {
                        if (error) {
                            throw error
                        }
                        if (row !== undefined) {
                            return await reactionMessage.channel.send(playerToExpel + " is already expelled, " + verifier.toString());
                        } else {
                            this.client.database.run(`INSERT INTO expelled(name) VALUES('${playerToExpel.toUpperCase()}')`, (error, row) => {
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
                    await this.client.channels.get(Channels.verificationsLog.id).send(failedVerificationLogEmbed);

                    if (memberVerifying !== undefined) {
                        this.client.database.get(`SELECT * FROM pending WHERE ID = '${memberVerifying.id}'`, async (error, row) => {
                            if (error) {
                                throw error
                            }
                            if (row !== undefined) {
                                this.client.database.run(`DELETE FROM pending WHERE ID = '${memberVerifying.id}'`)
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
                    this.client.database.get(`SELECT * FROM expelled WHERE name = '${playerToExpel.toUpperCase()}'`, async (error, row) => {
                        if (error) {
                            throw error
                        }

                        if (memberVerifying !== undefined) {
                            this.client.database.get(`SELECT * FROM pending WHERE ID = '${memberVerifying.id}'`, async (error, row) => {
                                if (error) {
                                    throw error
                                }
                                if (row !== undefined) {
                                    this.client.database.run(`DELETE FROM pending WHERE ID = '${memberVerifying.id}'`)
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

                        await this.client.channels.get(Channels.verificationsLog.id).send(failedVerificationLogEmbed);
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

            if (reactionChannel.id === Channels.verificationsManualVeteran.id) {
                const verifier = await reactionMessage.guild.members.fetch(user.id);

                if (reaction.emoji.name === "🔑" || reaction.emoji.name === "↩") {
                    await reactionMessage.reactions.removeAll();
                    await reactionMessage.react("✅");
                    await reactionMessage.react("❌");
                    await reactionMessage.react("🔒");
                } else if (reaction.emoji.name === "🔒") {
                    await reactionMessage.reactions.removeAll();
                    await reactionMessage.react("🔑");
                } else if (reaction.emoji.name === "❌") {
                    const memberVerifyingTag = reactionMessage.embeds[0].description.split(', ')[0]
                    const memberVerifyingID = memberVerifyingTag.match(/<@!?(1|\d{17,19})>/)[1]
                    const memberVerifying = await reactionMessage.guild.members.fetch(memberVerifyingID)

                    if (memberVerifying !== undefined) {
                        this.client.database.get(`SELECT * FROM pending WHERE ID = '${memberVerifying.id}'`, async (error, row) => {
                            if (error) {
                                throw error
                            }
                            if (row !== undefined) {
                                this.client.database.run(`DELETE FROM pending WHERE ID = '${memberVerifying.id}'`)
                            }
                        })
                    }

                    let failedVerificationLogEmbed = new Discord.MessageEmbed()
                        .setFooter("User ID: " + memberVerifyingID)
                        .setColor("#cf0202")
                    failedVerificationLogEmbed.addField("Application Rejected", `${memberVerifying.toString()} had their veteran raider application rejected by ${verifier.toString()}.`)
                    await this.client.channels.get(Channels.verificationsLog.id).send(failedVerificationLogEmbed)

                    await reactionMessage.reactions.removeAll();
                    let reactionMessageEmbed = reactionMessage.embeds[0]
                    reactionMessageEmbed.footer = { text: "Rejected by " + verifier.displayName }
                    await reactionMessage.edit(reactionMessageEmbed)
                    await reactionMessage.react("👋");
                    if (reactionMessage.pinned) {
                        await reactionMessage.unpin();
                    }
                } else if (reaction.emoji.name === `✅`) {
                    const memberVerifyingTag = reactionMessage.embeds[0].description.split(', ')[0]
                    const memberVerifyingID = memberVerifyingTag.match(/<@!?(1|\d{17,19})>/)[1]
                    const memberVerifying = await reactionMessage.guild.members.fetch(memberVerifyingID)

                    if (memberVerifying !== undefined) {
                        this.client.database.get(`SELECT * FROM pending WHERE ID = '${memberVerifying.id}'`, async (error, row) => {
                            if (error) {
                                throw error
                            }
                            if (row !== undefined) {
                                this.client.database.run(`DELETE FROM pending WHERE ID = '${memberVerifying.id}'`)
                            }
                        })
                    }

                    const veteranRaiderRole = reactionMessage.guild.roles.get(Roles.veteranRaider.id)
                    const reactionMember = await reactionMessage.guild.members.fetch(memberVerifyingID).catch()
                    reactionMember.roles.add(veteranRaiderRole)

                    let successfulVerificationLogEmbed = new Discord.MessageEmbed()
                        .setFooter("User ID: " + memberVerifying)
                        .setColor("3ea04a")
                        .addField("Successful Verification", verifier.toString() + " has given the member " + memberVerifying.toString() + " the veteran raider role.");
                    await this.client.channels.get(Channels.verificationsLog.id).send(successfulVerificationLogEmbed);
                    await reactionMessage.reactions.removeAll();
                    let reactionMessageEmbed = reactionMessage.embeds[0]
                    reactionMessageEmbed.footer = { text: "Verified by " + verifier.displayName }
                    await reactionMessage.edit(reactionMessageEmbed)
                    await reactionMessage.react("💯");
                    if (reactionMessage.pinned) {
                        await reactionMessage.unpin();
                    }
                }
            }

            if (reactionChannel.id === Channels.verificationsVeteran.id) {
                if (!antiflood.has(user.id)) {
                    antiflood.add(user.id);

                    setTimeout(() => {
                        antiflood.delete(user.id);
                    }, antifloodTime * 1000 * 10)
                } else {
                    reaction.users.remove(user.id)
                    return
                }

                const veteranRaiderRole = reactionMessage.guild.roles.get(Roles.veteranRaider.id)
                const reactionMember = await reactionMessage.guild.members.fetch(user.id)

                if (reaction.emoji.name === `✅`) {
                    if (reactionMember.roles.find(role => role.id === veteranRaiderRole.id)) {
                        const errorMessage = await reactionChannel.send(`<@${user.id}>, you already have the Veteran Raider Role.`)
                        await sleep(10000)
                        await errorMessage.delete()
                        return
                    }

                    const pendingRow = await this.client.database.getAsync(`SELECT * FROM pending WHERE ID = '${user.id}'`)
                    if (pendingRow) {
                        const errorMessage = await reactionChannel.send(`<@${user.id}>, there can only be 1 verification active at a time.`)
                        await sleep(10000)
                        await errorMessage.delete()
                        return
                    }

                    const axios = require("axios");
                    axios.defaults.timeout = 10000;
                    const cheerio = require("cheerio");
                    const otherClasses = [`Wizard`, `Archer`, `Huntress`, `Necromancer`, `Mystic`]
                    const neededClasses = [`Priest`, `Warrior`, `Samurai`, `Ninja`, `Knight`, `Paladin`, `Trickster`, `Rogue`, `Assassin`]
                    const inGameNames = reactionMember.nickname.match(/\b[a-zA-Z]+\b/g)

                    if (!inGameNames) {
                        const errorMessage = await reactionChannel.send(`<@${user.id}>, you do not have a nickname set, please contact a staff member.`)
                        await sleep(10000)
                        await errorMessage.delete()
                        return
                    }

                    let doesMeetStatRequirements = false
                    let doesMeetCharacterRequirements = false
                    let characterCount = 0
                    for (const inGameName of inGameNames) {
                        await axios.get("https://www.realmeye.com/player/" + inGameName, { headers: { 'User-Agent': 'Public Halls (LHS) Verification Bot' } }).then(async response => {
                            if (response.status === 200) {
                                const htmlData = response.data
                                const $ = cheerio.load(htmlData)

                                const classes = []
                                $(`tr`).children().each((i, element) => {
                                    if (!element.children[0]) return
                                    if (neededClasses.includes(element.children[0].data) || otherClasses.includes(element.children[0].data)) classes.push(element.children[0].data)
                                })

                                const charStats = $('.player-stats').text();
                                const charStatsSplit = charStats.match(/.{3}/g)
                                let maxCharCount = 0
                                let neededClassCount = 0
                                if (charStatsSplit) {
                                    for (let i = 0; i < charStatsSplit.length; i++) {
                                        if (neededClasses.includes(classes[i])) neededClassCount += 1
                                        if (charStatsSplit[i] === "8/8") maxCharCount += 1
                                    }
                                }

                                const currentCharacterCount = $('.active').text().replace(/[^0-9]/g, '');
                                characterCount += currentCharacterCount

                                if (maxCharCount >= 2) {
                                    doesMeetStatRequirements = true
                                }

                                if (neededClassCount > 0) {
                                    doesMeetCharacterRequirements = true
                                }
                            } else {
                                const errorMessage = await reactionChannel.send(`<@${user.id}>, failed to connect to RealmEye. This may be due to your nickname not being set correctly. Please try again or contact a staff member.`)
                                await sleep(10000)
                                await errorMessage.delete()
                            }
                        })
                    }

                    if (characterCount < 1) {
                        const errorMessage = await reactionChannel.send(`<@${user.id}>, can't find any characters, make sure they aren't hidden and try again.`)
                        await sleep(10000)
                        await errorMessage.delete()
                        return
                    }

                    let doesMeetRunRequirements = false
                    const statsRow = await this.client.database.getAsync(`SELECT * FROM stats WHERE ID = '${user.id}'`)
                    const runsDone = statsRow.voidsDone + statsRow.cultsDone
                    if (runsDone >= 100) {
                        doesMeetRunRequirements = true
                    }

                    if (!doesMeetStatRequirements || !doesMeetRunRequirements || !doesMeetCharacterRequirements) {
                        let reportMessage = ``
                        if (!doesMeetStatRequirements) reportMessage = reportMessage + `Does not have enough 8/8 characters.`
                        if (!doesMeetCharacterRequirements) reportMessage = reportMessage + `\nDoes not have an 8/8 priest or melee.`
                        if (!doesMeetRunRequirements) reportMessage = reportMessage + `\nDoes not have 100 Lost Halls runs done. (Currently: ${runsDone})`
                        if (inGameNames.length === 1) {
                            reportMessage = reportMessage + `\n[Player Profile](https://www.realmeye.com/player/${inGameNames[0]})`
                        } else {
                            let i = 0
                            for (const inGameName of inGameNames) {
                                i++
                                reportMessage = reportMessage + `\n[Player Profile ${i}](https://www.realmeye.com/player/${inGameName})`
                            }
                        }


                        let reportEmbed = new Discord.MessageEmbed()
                            .setColor("#940000")
                            .setDescription(reactionMember.toString() + " trying to verify as: " + reactionMember.nickname)
                            .addField("Problems: ", reportMessage)
                            .setTimestamp()

                        const verificationsManualVeteran = this.client.channels.get(Channels.verificationsManualVeteran.id)
                        const failedApplicationReportMessage = await verificationsManualVeteran.send(reportEmbed);
                        await failedApplicationReportMessage.react("🔑")
                        await failedApplicationReportMessage.pin()

                        const systemMesssages = await verificationsManualVeteran.messages.fetch({ after: failedApplicationReportMessage.id }).catch()
                        for (let message of systemMesssages.values()) {
                            if (message.system) await message.delete().catch()
                        }

                        this.client.database.run(`INSERT INTO pending(ID, name) VALUES('${user.id}', '${inGameNames[0].toUpperCase()}')`)
                        const errorMessage = await reactionChannel.send(`<@${user.id}>, you do not meet the requirements, you will now get a manual review of your application. Try again later.`)
                        await sleep(10000)
                        await errorMessage.delete()
                    } else {
                        reactionMember.roles.add(veteranRaiderRole)
                        const successMessage = await reactionChannel.send(`<@${user.id}>, gave you the Veteran Raider Role.`)
                        await sleep(10000)
                        await successMessage.delete()
                    }
                    //Verify, send to VeriVeteranPending
                } else if (reaction.emoji.name === `❌`) {
                    if (reactionMember.roles.find(role => role.id === veteranRaiderRole.id)) {
                        reactionMember.roles.remove(veteranRaiderRole)
                        const successMessage = await reactionChannel.send(`<@${user.id}>, removed your Veteran Raider role.`)
                        await sleep(10000)
                        await successMessage.delete()
                    } else {
                        const errorMessage = await reactionChannel.send(`<@${user.id}>, you do not have the Veteran Raider Role.`)
                        await sleep(10000)
                        await errorMessage.delete()
                    }
                }
            }
        })

        this.client.on('messageUpdate', async (oldMessage, newMessage) => {
            if (newMessage.channel.id === Channels.verificationsAutomatic.id) {
                const devRole = newMessage.guild.roles.find(role => role.id === Roles.security.id);
                if (newMessage.member.roles.highest.position < devRole.position) {
                    newMessage.delete()
                }
            }
        })

        this.client.on('guildMemberAdd', async member => {
            this.client.database.get(`SELECT * FROM stats WHERE ID = '${member.id}'`, (error, row) => {
                if (row !== undefined) return;
                this.client.database.run(`INSERT INTO stats(ID, lostHallsKeysPopped, otherKeysPopped, cultsDone, voidsDone, otherDungeonsDone, cultsLed, voidsLed, assists, currentCultsLed, currentVoidsLed, currentAssists, vialsStored, vialsUsed, commendations, commendedBy) VALUES(${member.id}, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '')`)
            })

            this.client.database.get(`SELECT * FROM suspended WHERE ID = '${member.id}'`, (error, row) => {
                const guild = this.client.guilds.get("343704644712923138");
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

        this.client.on('guildMemberRemove', async member => {
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
                this.client.database.get(`SELECT * FROM verified WHERE ID = '${member.id}'`, async (error, row) => {
                    if (error) {
                        throw error
                    }
                    if (row !== undefined) {
                        this.client.database.run(`DELETE FROM verified WHERE ID = '${member.id}'`)
                    }
                })
            }
        })

        const events = {
            MESSAGE_REACTION_ADD: 'messageReactionAdd',
            MESSAGE_REACTION_REMOVE: 'messageReactionRemove',
        }

        this.client.on('raw', async event => {
            if (!events.hasOwnProperty(event.t)) return;
            const { d: data } = event;
            if (data.channel_id !== Channels.verificationsManual.id && data.channel_id !== Channels.verificationsEvents.id && data.channel_id !== Channels.historyDMs.id && data.channel_id !== Channels.verificationsVeteran.id && data.channel_id !== Channels.verificationsManualVeteran.id) return;
            const user = this.client.users.get(data.user_id);
            const channel = this.client.channels.get(data.channel_id);

            if (channel.messages.has(data.message_id)) return;

            const message = await channel.messages.fetch(data.message_id);
            const emojiKey = (data.emoji.id) ? `${data.emoji.name}:${data.emoji.id}` : data.emoji.name;
            const reaction = message.reactions.get(emojiKey);
            this.client.emit(events[event.t], reaction, user);
        })
    }

    loadCommands() {
        this.client.commands = new Discord.Collection()

        FileSystem.readdir("./commands", (error, files) => {
            if (error) console.log(error);

            //JavaSript files only
            let filteredFiles = files.filter(f => f.split(".").pop() === "js");

            if (filteredFiles.length <= 0) {
                console.log("Folder not found or zero length (empty)");
                return;
            }

            filteredFiles.forEach((f, i) => {
                let file = require(`./commands/${f}`);
                this.client.commands.set(file.help.name.toUpperCase(), file);
            });

            console.log(`Loaded ${filteredFiles.length} commands.`)
        })
    }

    loadDatabase() {
        this.client.database = new Sqlite3.Database(`../data/database`, error => {
            if (error) {
                throw error
            }
            console.log('Connected to the in-memory SQlite3 database.')
        })

        new DatabaseExtensionModule(this.client).extend()
    }

    setupAntiFlood() {
        this.client.antiflood = new Set();
        this.client.antifloodTime = 3;  // in seconds
    }
    
    async checkAutomaticSuspensions() {
        this.client.database.serialize(() => {
            const guild = this.client.guilds.get("343704644712923138");
            const suspensionLogChannel = this.client.channels.get(Channels.suspendLog.id)
    
            this.client.database.each(`SELECT * FROM suspended`, async (error, row) => {
                if (error) {
                    console.log(row)
                    throw error
                }
                const ID = row.ID.toString()
                const member = await guild.members.fetch(ID).catch((err) => {
                    this.client.database.run((`DELETE FROM suspended WHERE ID = ${row.ID}`), (error, row) => {
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
    
                        this.client.database.run(`DELETE FROM suspended WHERE ID = ${row.ID}`)
    
                        await suspensionLogChannel.send(member.toString() + " you have been unsuspended.");
                    }
                }
            })
        })
    }
}