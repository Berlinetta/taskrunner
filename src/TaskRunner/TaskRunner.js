import StateTree from "./StateTree";
import TaskExecutionService from "./services/TaskExecutionService";
import ConcurrentTask from "./tasks/ConcurrentTask";
import SequentialTask from "./tasks/SequentialTask";
import ComposeTask from "./tasks/ComposeTask";
import NormalTask from "./tasks/NormalTask";

const TES = new TaskExecutionService();

class TaskRunner {
    constructor() {
        this.store = new StateTree({
            handlers: [],
            tasks: {}
        });
    }

    register(...newTasks) {
        newTasks.forEach((task) => {
            const instance = new NormalTask(this.store);
            instance.initialize(task);
        });
    }

    concurrent(...newTasks) {
        const instance = new ConcurrentTask(this.store);
        instance.initialize(newTasks);
    }

    sequential(...newTasks) {
        const instance = new SequentialTask(this.store);
        instance.initialize(newTasks);
    }

    compose(...newTasks) {
        const instance = new ComposeTask(this.store);
        instance.initialize(newTasks);
    }

    run() {
        TES.updateGlobalDependencies(this.store);
        const initTaskIds = TES.getInitialTaskIds(this.store.select("tasks"));
        TES.runTasks(initTaskIds, this.store);
        return TES.getTaskRunnerPromise(this.store);
    }
}

export default TaskRunner;