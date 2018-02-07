import _ from "lodash";
import Promise from "bluebird";
import {TaskTypes} from "../Models";
import InternalTaskBase from "./common/InternalTaskBase";
import TaskExecutionService from "../services/TaskExecutionService";

const TES = new TaskExecutionService();

class ComposeTask extends InternalTaskBase {
    constructor(store) {
        super(_.uniqueId("compose_task_"), TaskTypes.Composed, store);
    }

    updateNavigationFields(tasksCursor, internalTaskIds) {
        const tasks = tasksCursor.get();
        internalTaskIds.forEach((taskId) => {
            this.assertTaskExists(tasks, taskId);
            tasks[taskId].parentComposedTaskId = this.id;
        });
        tasksCursor.set(tasks);
    }

    initialize(newTasks) {
        const tasksCursor = this.store.select("tasks");
        super.initialize(tasksCursor, newTasks);
        this.updateNavigationFields(tasksCursor, newTasks.map((t) => t.id));
        this.registerStartEvent(this.store);
        this.handleTaskComplete(this.store);
    }

    execute(param, store) {
        this.store = store;
        const initTaskIds = TES.getInitialTaskIdsForComposedTask(store.select("tasks", this.id));
        TES.runTasks(initTaskIds, store);
        this.setStartFlag(this.id);
        return Promise.resolve();
    }
}

export default ComposeTask;