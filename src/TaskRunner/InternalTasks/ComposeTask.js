import _ from "lodash";
import Promise from "bluebird";
import {TaskTypes} from "../Models";
import {InternalTaskBase} from "./InternalTaskBase";
import TaskExecutionService from "../Services/TaskExecutionService";

const TES = new TaskExecutionService();

class ComposeTask extends InternalTaskBase {
    constructor(store) {
        super(_.uniqueId("compose_task_"), store);
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
        this._registerInnerTask(this.store, newTasks, TaskTypes.Composed);
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