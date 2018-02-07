import StateTree from "./common/StateTree";
import ConcurrentTask from "./tasks/ConcurrentTask";
import SequentialTask from "./tasks/SequentialTask";
import ComposeTask from "./tasks/ComposeTask";
import NormalTask from "./tasks/NormalTask";
import TS from "./services/TreeService";
import TES from "./services/TaskExecutionService";

class TaskRunner {
    constructor() {
        this.store = new StateTree({
            handlers: [],
            tasks: {}
        });
        TS.initialize(this.store);
        //todo: debug.
        window.store = this.store;
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
        return instance;
    }

    run() {
        TES.updateGlobalDependencies();
        const initTaskIds = TES.getInitialTaskIds();
        TES.runTasks(initTaskIds);
        return TES.getTaskRunnerPromise();
    }
}

export default TaskRunner;