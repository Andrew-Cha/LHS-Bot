const Discord = require("discord.js");
const Channels = require("../dataFiles/channels.json")

module.exports.run = async (lanisBot, message, args) => {
    const guild = lanisBot.guilds.get("343704644712923138");
    let member;
    let input = args[0]
    if (input === undefined) {
        member = await guild.members.fetch(message.author.id)
    } else {
        //Try to grab numbers only
        let inputReplaced = input.replace(/[^0-9]/g, '')
        if (inputReplaced.length < 17) {
            let searchResult = guild.members.find(member => member.displayName.toUpperCase() == input.toUpperCase())
            if (searchResult !== undefined) {
                member = await guild.members.fetch(searchResult)
            } else {
                await message.react("⚠")
                const errorMessage = await message.channel.send("Sorry, can't find this member.")
                if (message.channel.type !== "dm") {
                    await sleep(10000)
                    await errorMessage.delete()
                    await message.delete()
                }
                return
            }
        } else {
            member = await guild.members.fetch(inputReplaced)
        }
    }

    if (member === undefined) {
        await message.react("⚠")
        if (message.channel.type !== "dm") {
            await sleep(10000)
            await errorMessage.delete()
            await message.delete()
        }
        return
    }

    let thumbnail = await member.user.avatarURL();

    function sortGuild(lhs, rhs) {
        return lhs.joinedTimestamp - rhs.joinedTimestamp
    }

    let guildMembers = await guild.members.fetch()
    guildMembers = guildMembers.array()
    guildMembers.sort(sortGuild)

    let index = 1
    guildMembers.find(memberFilter => {
        if (memberFilter.id === member.id) {
            return true
        } else {
            index += 1
        }
    })

    lanisBot.database.get(`SELECT * FROM stats WHERE ID = '${member.id}'`, async (error, row) => {
        if (row === undefined) return message.react("⚠")
        let reply = new Discord.MessageEmbed()
            .setColor("#00FF00")
            .setThumbnail(thumbnail)
            .addField(`<:lostHallsKey:506080313974325248> Keys Popped <:lostHallsKey:506080313974325248>`, `Lost Halls: ${row.lostHallsKeysPopped}\nOther: ${row.otherKeysPopped}`)
            .addField(`<:lostHallsCultist:506091048469004291> Runs Done <:lostHallsCultist:506091048469004291>`, `Cult: ${row.cultsDone}\nVoid: ${row.voidsDone}\nOther: ${row.otherDungeonsDone}\n\nCults Led: ${row.cultsLed}\nVoids Led: ${row.voidsLed}\nRuns Assisted: ${row.assists}`)
            .addField(`<:lostHallsVial:506091071655378974> Vials <:lostHallsVial:506091071655378974>`, `Stored: ${row.vialsStored}\nUsed: ${row.vialsUsed}`)
            .setFooter(`Commendations: ${row.commendations} | Member #${index} | Joined at`)
            .setTimestamp(member.joinedAt)
            .setDescription(" <:lostHallsDungeon:506072260139024395> **Statistics for " + member.displayName + "** <:lostHallsDungeon:506072260139024395>");

        if (member.id === "175678288402841601") {
            reply.addField("PP Size", "This is a size intended to be read by ants")
        }

        if (member.id === "185842993616388096") {
            reply.addField("PP Size", "two number 9s, a number 9 large, a number 6 with extra dip, a number 7, two number 45s, one with cheese, and a large soda.")
        }

        let failed = false
        await message.author.send(reply).catch(error => {
            if (error) {
                failed = true
                message.react("⚠")
            }
        })

        if (!failed) {
            message.react("✅")
            const historyDMs = lanisBot.channels.get("396694518738714634")
            let reportEmbed = new Discord.MessageEmbed()
                .addField("Sent Stats", `User <@${message.author.id}> has received their stats of user <@${member.id}> after requesting them.`)
                .setColor("3ea04a")
                .setFooter("User ID: " + message.author.id)
                .setTimestamp()

            if (message.channel.type === "dm") {
                reportEmbed.addField("Channel Type", "Direct Message")
            } else {
                reportEmbed.addField("Channel Type", `<#${message.channel.id}>`)
            }

            await historyDMs.send(reportEmbed)
        }
    })

    if (message.channel.type !== "dm") {
        await sleep(30000)
        await message.delete()
    }

}

module.exports.help = {
    name: "stats",
    category: "Raiding",
    example: "`-stats [User Mention / User ID / Nickname]`",
    explanation: "Displays the stats for the member, runs done, vials logged, keys popped."
}

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}