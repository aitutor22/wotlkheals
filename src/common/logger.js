class Logger {
    // output can be one of the following
    // 0 - console,
    // 1 - array object
    constructor(logLevel, outputLocation=0) {
        this._logLevel = logLevel;
        this._outputLocation = outputLocation;
        this._resultArr = [];
    }

    saveToArray(message) {
        this._resultArr.push(message);
    }

    // logs message if logger's level exceeds minLogLevel
    log(message, minLogLevel) {
        if (this._logLevel >= minLogLevel) {
            if (this._outputLocation === 0) {
                console.log(message);
            } else if (this._outputLocation === 1) {
                this.saveToArray(message);
            }
        }
    }
}

module.exports = Logger;