class BaseTask {
    constructor(id, param = null) {
        this.id = id;
        this.param = param;
        this.handlers = [];
    }

    on(eventType, callback) {
        //todo: add dup check?
        this.handlers.push({event: eventType, handler: callback});
    }

    off() {
        //todo: off events.
    }

    initialize() {

    }

    execute() {
    }
}

export default BaseTask;