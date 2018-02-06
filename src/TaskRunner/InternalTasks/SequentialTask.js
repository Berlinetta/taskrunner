import _ from "lodash";
import Promise from "bluebird";
import {TaskTypes} from "../Models";
import {InternalTaskBase} from "./InternalTaskBase";

class SequentialTask extends InternalTaskBase {
    constructor(store) {
        super(_.uniqueId("sequential_task_"), store);
    }

    updateNavigationFields(tasksCursor, internalTaskIds) {
        const tasks = tasksCursor.get();
        internalTaskIds.forEach((id, i, arr) => {
            this.assertTaskExists(tasks, id);
            tasks[id].previousSequentialTaskId = i === 0 ? null : arr[i - 1];
        });
        tasksCursor.set(tasks);
    }

    registerWorkflowEvents(store) {
        const tasksCursor = store.select("tasks");
        const taskCursor = tasksCursor.select(this.id);
        const innerTasksCursor = taskCursor.select("innerTasks");
        taskCursor.select("start").on("update", (e) => {
            if (e.data === true) {
                const innerTaskIds = innerTasksCursor.get().map((t) => t.id);
                if (innerTaskIds.length > 0) {
                    this.assertTaskExists(tasksCursor.get(), innerTaskIds[0]);
                    this.setStartFlag(innerTaskIds[0]);
                }
            }
        });
        innerTasksCursor.get().map((t) => t.id).forEach((innerTaskId) => {
            const innerTaskCursor = taskCursor.tree.select("tasks", innerTaskId);
            const prevTaskId = innerTaskCursor.select("previousSequentialTaskId").get();
            if (!_.isEmpty(prevTaskId)) {
                tasksCursor.select(prevTaskId, "complete").on("update", (e) => {
                    if (e.data === true) {
                        //todo: remove logs.
                        console.log(`Prev task ${prevTaskId} completed, now starting ${innerTaskId}`);
                        this.setStartFlag(innerTaskId);
                    }
                });
            }
        });
    }

    initialize(newTasks) {
        const tasksCursor = this.store.select("tasks");
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

export default SequentialTask;