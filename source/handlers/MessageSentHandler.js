const Discord = require(`discord.js`)

/** Message Sent Event Handler */
module.exports = class MessageSentHandler {
    /** 
     * Handles the message sent event.
     * @param {Discord.Client} client The client that will handle the message.
     * @param {Discord.Message} message The message that the bot receives.
    */

    handleMessageSent(client, message) {
        if (message.content === null) {
            return
        }

        if (message.author.bot) {
            return
        }

        if (message.channel.type === "dm") {
            return
        }
        
        client.database.get(`SELECT * FROM guildSetup WHERE guildID = '${message.guild.id}'`, (error, row) => {
            //clears all white spacing
            let contentStringified = message.content.match(/\S+/g)
            if (contentStringified === null) {
                return
            }

            let prefix = row.prefix ? row.prefix : client.prefix
            let command = contentStringified[0]
            if (command.indexOf(prefix) !== 0) {
                return
            }

            if (client.antiflood.has(message.author.id)) {
                message.reply(`You must wait ${client.antifloodTime} seconds before sending another command.`)
                return
            }

            client.antiflood.add(message.author.id)
            setTimeout(() => {
                client.antiflood.delete(message.author.id)
            }, client.antifloodTime * 1000)

            let commandFile = client.commands.get(command.slice(prefix.length).toUpperCase())
            if (commandFile) {
                let args = contentStringified.slice(1)
                commandFile.run(client, message, args)
            }
        })
    }
}