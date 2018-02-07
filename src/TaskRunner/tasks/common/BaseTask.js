class BaseTask {
    constructor(id, param) {
        this.id = id;
        this.param = param;
        this.handlers = [];
    }

    on(eventType, callback) {
        //todo: add dup check?
        this.handlers.push({event: eventType, handler: callback});
    }

    initialize() {

    }

    execute() {
    }
}

export default BaseTask;