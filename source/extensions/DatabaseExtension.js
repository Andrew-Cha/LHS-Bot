module.exports = class DatabaseExtension {

    constructor(client) {
        this.client = client
    }

    extend() {
        this.client.database.getAsync = function (sql) {
            const that = this
            return new Promise(function (resolve, reject) {
                that.get(sql, (error, row) => {
                    if (error) {
                        reject(error)
                    } else {
                        resolve(row)
                    }
                })
            })
        }

        this.client.database.runAsync = function (sql) {
            const that = this
            return new Promise(function (resolve, reject) {
                that.run(sql, (error) => {
                    if (error) {
                        reject(error)
                    } else {
                        resolve()
                    }
                })
            })
        }

        this.client.database.allAsync = function (sql) {
            const that = this
            return new Promise(function (resolve, reject) {
                that.all(sql, (error, rows) => {
                    if (error) {
                        reject(error)
                    } else {
                        resolve(rows)
                    }
                })
            })
        }
    }

}