const Discord = require("discord.js");
const config = require("../../data/config.json");

module.exports.run = async (client, message, args) => {
    let abortRestart = false;

    await new Promise(async (resolve, reject) => {
        await message.channel.send("Are you sure you want to **restart** the bot?");
        const messageFilter = (responseMessage, user) => responseMessage.content != "" && responseMessage.author === message.author;
        const safeGuardCollector = new Discord.MessageCollector(message.channel, messageFilter, { time: 60000 });
        safeGuardCollector.on("collect", async (responseMessage, safeGuardCollector) => {
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
        await message.channel.send("Restarting the bot.");
    }).catch(async (failureMessage) => {
        await message.channel.send("Not restarting the bot.");
        abortRestart = true;
    });

    if (abortRestart) return;
    await client.destroy();
    await client.login(config.token);
}

module.exports.help = {
    name: "restart",
    category: "Bot",
    example: "`-restart`",
    explanation: "To be used when the bot is totally broken, logs it in and out of Discord."
}
 