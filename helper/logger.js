class Logger {
    constructor() {
        if (Logger.instance) {
            return Logger.instance;
        }
  
        this.logs = [];
        Logger.instance = this;
    }
  
    log(message) {
        this.logs.push(message);
        console.log(message);
    }
  
    getLogs() {
        return this.logs;
    }
}
module.exports = new Logger();