module.exports = class DatabaseExtension {

    constructor(client) {
        this.client = client
    }

    extend() {
        /**
         * @description Pauses the code execution for @param ms miliseconds
         * @param ms The amount of miliseconds to pause code execution for.
         */
        this.client.sleep = function (ms) {
            return new Promise(resolve => {
                setTimeout(resolve, ms)
            })
        }
    }
}