import StateTree from "./StateTree";
import TaskCreationService from "./Services/TaskCreationService";
import TaskExecutionService from "./Services/TaskExecutionService";

const TCS = new TaskCreationService();
const TES = new TaskExecutionService();

class TaskRunner {
    constructor() {
        this.store = new StateTree({
            handlers: [],
            tasks: {}
        });
    }

    register(...newTasks) {
        TCS.createNormalTasks(newTasks, this.store.select("tasks"));
    }

    concurrent(...newTasks) {
        TCS.createNewConcurrentTask(newTasks, this.store.select("tasks"));
    }

    sequential(...newTasks) {
        TCS.createNewSequentialTask(newTasks, this.store.select("tasks"));
    }

    compose(...newTasks) {
        return TCS.createNewComposeTask(newTasks, this.store.select("tasks"));
    }

    run() {
        TCS.updateGlobalDependencies(this.store);
        const initTaskIds = TES.getInitialTaskIds(this.store.select("tasks"));
        TES.runTasks(initTaskIds, this.store);
        return TES.getTaskRunnerPromise(this.store);
    }
}

export default TaskRunner;