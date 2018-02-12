import StateTree from "./common/StateTree";
import ConcurrentTask from "./tasks/ConcurrentTask";
import SequentialTask from "./tasks/SequentialTask";
import CompositeTask from "./tasks/CompositeTask";
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

    concurrent(...newTasks) {
        TES.registerNormalTasks(newTasks);
        const instance = new ConcurrentTask();
        instance.initialize(newTasks);
        return instance;
    }

    sequential(...newTasks) {
        TES.registerNormalTasks(newTasks);
        const instance = new SequentialTask();
        instance.initialize(newTasks);
        return instance;
    }

    composite(...newTasks) {
        TES.registerNormalTasks(newTasks);
        const instance = new CompositeTask();
        instance.initialize(newTasks);
        return instance;
    }

    run(...initialTaskIds) {
        TES.updateGlobalDependencies();
        TES.registerStart();
        TES.runTasks(initialTaskIds);
        return TES.getTaskRunnerPromise();
    }
}

export default TaskRunner;