import _ from "lodash";
import Promise from "bluebird";
import {TaskTypes} from "../Models";
import InternalTaskBase from "./common/InternalTaskBase";

class ConcurrentTask extends InternalTaskBase {
    constructor(store) {
        super(_.uniqueId("concurrent_task_"), TaskTypes.Concurrent, store);
    }

    updateNavigationFields(tasksCursor, internalTaskIds) {
        const tasks = tasksCursor.get();
        internalTaskIds.forEach((taskId) => {
            this.assertTaskExists(tasks, taskId);
            tasks[taskId].parentConcurrentTaskId = this.id;
        });
        tasksCursor.set(tasks);
    }

    registerWorkflowEvents(store) {
        const taskCursor = store.select("tasks", this.id);
        taskCursor.select("start").on("update", (e) => {
            if (e.data === true) {
                taskCursor.select("innerTasks").get().forEach((task) => {
                    this.setStartFlag(task.id);
                });
            }
        });
    }

    //todo: use internal store, don't pass args.
    initialize(newTasks) {
        const tasksCursor = this.store.select("tasks");
        super.initialize(tasksCursor, newTasks);
        this.updateNavigationFields(tasksCursor, newTasks.map((t) => t.id));
        this.registerWorkflowEvents(this.store);
        this.registerStartEvent(this.store);
        this.handleTaskComplete(this.store);
    }

    execute(param, store) {
        this.store = store;
        this.setStartFlag(this.id);
        return Promise.resolve();
    }
}

export default ConcurrentTask;