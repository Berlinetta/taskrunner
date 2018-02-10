import Promise from "bluebird";
import BaseTask from "../TaskRunner/tasks/common/BaseTask";

class DemoClassBase extends BaseTask {
    constructor(id, param, isInitialTask = false) {
        super(id, param, isInitialTask);
        this.on("start", this.handleTaskStart);
        this.on("complete", this.handleTaskComplete);
        this.on("error", this.handleTaskComplete);
        this.name = this.getName();
        this.delayTime = this.getDelayTime();
    }

    getName() {
        return "";
    }

    getDelayTime() {
        return 0;
    }

    handleTaskError() {
        console.log(`${this.name} errored`);
    }

    handleTaskStart() {
        console.log(`${this.name} started`);
    }

    handleTaskComplete() {
        console.log(`User task log: ${this.name} completed!`);
    }

    execute() {
        return Promise.delay(this.delayTime).then(() => {
            return {name: this.name};
        });
    }
}

export default DemoClassBase;
