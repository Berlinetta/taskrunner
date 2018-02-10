import _ from "lodash";
import Promise from "bluebird";
import {TaskTypes} from "../common/Constants";
import InternalTaskBase from "./common/InternalTaskBase";
import TS from "../services/TreeService";

class SequentialTask extends InternalTaskBase {
    constructor() {
        super(_.uniqueId("sequential_task_"), TaskTypes.Sequential);
    }

    updateNavigationFields(internalTaskIds) {
        internalTaskIds.forEach((taskId, i, arr) => {
            this.assertTaskExists(taskId);
            const taskCursor = TS.getTaskCursorById(taskId);
            taskCursor.select("previousSequentialTaskId").set(i === 0 ? null : arr[i - 1]);
            taskCursor.select("parentSequentialTaskId").set(this.id);
        });
    }

    registerWorkflowEvents() {
        const taskCursor = TS.getTaskCursorById(this.id);
        const innerTasksCursor = taskCursor.select("innerTasks");
        taskCursor.select("start").on("update", (e) => {
            if (e.data === true) {
                const innerTaskIds = innerTasksCursor.get().map((t) => t.id);
                if (innerTaskIds.length > 0) {
                    this.assertTaskExists(innerTaskIds[0]);
                    this.setStartFlag(innerTaskIds[0]);
                }
            }
        });
        innerTasksCursor.get().map((t) => t.id).forEach((innerTaskId) => {
            const innerTaskCursor = taskCursor.tree.select("tasks", innerTaskId);
            const prevTaskId = innerTaskCursor.select("previousSequentialTaskId").get();
            if (!_.isEmpty(prevTaskId)) {
                TS.getTasksCursor().select(prevTaskId, "complete").on("update", (e) => {
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
        super.initialize(newTasks);
        this.updateNavigationFields(newTasks.map((t) => t.id));
        this.registerWorkflowEvents();
        this.handleTaskComplete();
    }

    execute() {
        this.setStartFlag(this.id);
        return Promise.resolve();
    }
}

export default SequentialTask;