const _ = require("lodash");
const Promise = require("bluebird");

var err = new Error("haha");

new Promise(function (resolve, reject) {
    throw new Error("sdfsdff");
}).catch(111).catch((e) => {
    console.log(e);
});

var f1 = new Promise(function (resolve, reject) {
    setTimeout(resolve, 100, 'foo');
});

var fulfilledPromise = new Promise(function (resolve, reject) {
    setTimeout(resolve, 100, 'foo');
    return 111;
}).then((arg1, arg2) => {
    console.log(arg1 + arg2);
    throw new Error("haha");
    return 333;
}).then((a) => {
    console.log(a);
}).catch((b) => {
    console.log(b);
});


var errorPromise = new Promise(function (resolve, reject) {
    throw new Error("sdfsdff");
}).then((arg1, arg2) => {
    console.log(arg1 + arg2);
}).catch((arg1, arg2) => {
    console.log(arg1 + arg2);
    throw new Error("errpromise catch throw exp");
    return 1;
}).catch((a) => {
    console.log(a);
    return 111;
}).catch((b) => {
    console.log(b);
});

var rejectedPromise = new Promise(function (resolve, reject) {
    setTimeout(reject, 100, 'foo');
}).then((arg1, arg2) => {
    console.log(arg1 + arg2);
}).catch((arg1, arg2) => {
    console.log(arg1 + arg2);
});

Promise.race();

class MyPromise {
    constructor(executor) {
        if (!_.isFunction(executor)) {
            throw new Error(`TypeError: expecting a function but got ${typeof executor}`);
        }
        this.executor = executor;
        this.pending = true;
        this.fulfilled = false;
        this.rejected = false;
        this._executePromise();
    }

    _executePromise() {
        try {
            this.executor(this._resolve.bind(this), this._reject.bind(this));
        } catch (e) {
            this._reject(e);
        }
    }

    _resolve(successResult) {
        this.pending = false;
        this.fulfilled = true;
        this.rejected = false;
        this.successResult = successResult;
        this.triggerCatch = false;
    }

    _reject(failedResult) {
        this.pending = false;
        this.fulfilled = false;
        this.rejected = true;
        this.failedResult = failedResult;
        this.triggerCatch = true;
    }

    then(successProcessor) {
        if (!_.isFunction(successProcessor) || this.triggerCatch) {
            return this;
        }
        let result;
        let hasError = false;
        try {
            result = successProcessor(this.successResult)
        } catch (e) {
            result = e;
            hasError = true;
        }
        if (hasError) {
            this.failedResult = result;
            this.triggerCatch = true;
        } else {
            this.successResult = result;
            this.triggerCatch = false;
        }
        return this;
    }

    catch(rejectProcessor) {
        if (!_.isFunction(rejectProcessor) || !this.triggerCatch) {
            return this;
        }
        let result;
        let hasError = false;
        try {
            result = rejectProcessor(this.failedResult)
        } catch (e) {
            result = e;
            hasError = true;
        }
        if (hasError) {
            this.failedResult = result;
            this.triggerCatch = true;
        } else {
            this.failedResult = null;
            this.triggerCatch = false;
        }
        return this;
    }
}

var fp = new MyPromise(function (resolve, reject) {
    //setTimeout(, 100, 'foo');
    resolve(10000);
}).then((arg1, arg2) => {
    console.log(arg1 + arg2);
    throw new Error("haha");
    return 333;
}).then((a) => {
    console.log(a);
}).catch((b) => {
    console.log(b);
});