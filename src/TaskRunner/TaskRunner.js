import StateTree from "./StateTree";
import TS from "./services/TreeService";
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
        TS.initialize(this.store);
    }

    register(...newTasks) {
        newTasks.forEach((task) => {
            const instance = new NormalTask();
            instance.initialize(task);
        });
    }

    concurrent(...newTasks) {
        const instance = new ConcurrentTask();
        instance.initialize(newTasks);
    }

    sequential(...newTasks) {
        const instance = new SequentialTask();
        instance.initialize(newTasks);
    }

    compose(...newTasks) {
        const instance = new ComposeTask();
        instance.initialize(newTasks);
    }

    run() {
        TES.updateGlobalDependencies();
        const initTaskIds = TES.getInitialTaskIds();
        TES.runTasks(initTaskIds);
        return TES.getTaskRunnerPromise();
    }
}

export default TaskRunner;