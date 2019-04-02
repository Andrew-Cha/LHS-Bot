const Discord = require(`discord.js`)

const checkmarkEmoji = `✅`
const crossEmoji = `❌`
const emailEmoji = `📧`

/** Guild Join Event Handler */
module.exports = class ReactionHandler {

    /** 
     * Handles the guild join event.
     * @param {Discord.Client} client The client that will handle the message.
     * @param {Discord.MessageReaction} messageReaction The guild that the bot joins.
     * @param {Discord.User} user The user who reacted to the message.
    */
    handleReaction(client, messageReaction, user) {
        this.client = client
        this.messageReaction = messageReaction
        this.user = user

        this.guild = messageReaction.message.guild
        this.message = messageReaction.message
        this.channel = messageReaction.message.channel

        this.client.database.get(`SELECT * FROM roleDispensers WHERE guildID = '${this.guild.id}'`, (error, row) => {
            if (!row) return

            if (this.message.id === row.messageID) {
                this.handleReadyRoleReaction()
                return
            }
        })

        this.client.database.get(`SELECT * FROM verificationDispensers WHERE guildID = '${this.guild.id}'`, (error, row) => {
            if (!row) return
            
            if (this.message.id === row.messageID) {
                this.handleVerificationReaction()
                return
            }
        })
    }

    handleReadyRoleReaction() {
        this.client.database.get(`SELECT * FROM guildSetup WHERE guildID = '${this.guild.id}'`, async (error, row) => {
            const readyRole = this.guild.roles.get(row.readyRoleID)

            if (!readyRole) {
                return
            }

            const member = await this.guild.members.fetch(this.user.id);

            let addedToAntiFlood = false; //needed to we can check if we should send the message the first time they react.
            if (!this.client.antiflood.has(member.id)) {
                this.client.antiflood.add(member.id);
                addedToAntiFlood = true;

                setTimeout(() => {
                    this.client.antiflood.delete(member.id);
                }, this.client.antifloodTime * 1000)
            }

            let noPermissions = false
            if (this.messageReaction.emoji.name === checkmarkEmoji) {
                if (member.roles.find(role => role.id === readyRole.id === true)) {
                    if (addedToAntiFlood) {
                        const errorMessage = await this.channel.send(member.toString() + ", you already have the ready role.");
                        await sleep(10000);
                        await errorMessage.delete()
                    }
                } else {
                    await member.roles.add(readyRole).catch(() => {
                        this.guild.owner.send(`I can't add the ready role to people, please make sure it's below my role in the hierarchy.`)
                        noPermissions = true
                    })

                    if (noPermissions) return

                    if (addedToAntiFlood) {
                        const successMessage = await this.channel.send(member.toString() + ", gave you the ready role.");
                        await sleep(10000);
                        await successMessage.delete()
                    }
                }
            } else if (this.messageReaction.emoji.name === crossEmoji) {
                if (member.roles.find(role => role.id === readyRole.id === true)) {
                    await member.roles.remove(readyRole).catch(() => {
                        this.guild.owner.send(`I can't remove the ready role to people, please make sure it's below my role in the hierarchy.`)
                        noPermissions = true
                    })

                    if (noPermissions) return

                    if (addedToAntiFlood) {
                        const successMessage = await this.channel.send(member.toString() + ", removed your ready role.")
                        await sleep(10000);
                        await successMessage.delete()
                    }
                } else {
                    if (addedToAntiFlood) {
                        const errorMessage = await this.channel.send(member.toString() + ", you don't have the ready role.");
                        await sleep(10000);
                        await errorMessage.delete()
                    }
                }
            }
        })
    }

    handleVerificationReaction() {
        const token = `secretTokenLanis5671` //also found in Verify.js
        
        this.client.database.get(`SELECT * FROM guildSetup WHERE guildID = '${this.guild.id}'`, async (error, row) => {
            const verifiedRole = this.guild.roles.get(row.verifiedRoleID)

            if (!verifiedRole) {
                return
            }

            const member = await this.guild.members.fetch(this.user.id);
            if (!member) {
                return
            }

            if (this.messageReaction.emoji.name === emailEmoji) {
                const channel = await this.user.createDM()
                if (!channel) {
                    return
                }
                channel.send("This is your Discord Account's ID, please put it in your Lodestone account's description.\n```css\n" + this.user.id + "\n```")
            } else if (this.messageReaction.emoji.name === checkmarkEmoji) {
                const command = this.client.commands.get(`VERIFY`)
                if (command) {
                    command.run(this.client, member, this.message, [token])
                }
            }
        })
    }
}


function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}