import _ from "lodash";
import Promise from "bluebird";
import {TaskTypes} from "../common/Constants";
import InternalTaskBase from "./common/InternalTaskBase";
import TS from "../services/TreeService";

class SequentialTask extends InternalTaskBase {
    constructor() {
        super(_.uniqueId("sequential_task_"), TaskTypes.Sequential);
    }

    _setHooks(internalTaskIds) {
        internalTaskIds.forEach((taskId, i, arr) => {
            this.assertTaskExists(taskId);
            const taskCursor = TS.getTaskCursorById(taskId);
            taskCursor.select("previousSequentialTaskId").set(i === 0 ? null : arr[i - 1]);
            taskCursor.select("parentSequentialTaskId").set(this.id);
        });
    }

    _registerWorkflow() {
        const taskCursor = TS.getTaskCursorById(this.id);
        const innerTasksCursor = taskCursor.select("innerTasks");
        taskCursor.select("start").on("update", (e) => {
            if (e.data === true) {
                const innerTaskIds = innerTasksCursor.get().map((t) => t.id);
                if (innerTaskIds.length > 0) {
                    for (let i = 0; i < innerTaskIds.length; i++) {
                        const innerTaskId = innerTaskIds[i];
                        const isStart = TS.getTaskPropertyValue(innerTaskId, "start");
                        const isComplete = TS.getTaskPropertyValue(innerTaskId, "complete");
                        if (isComplete && !isStart) {
                            TS.setTaskStart(innerTaskId);
                            continue;
                        }
                        if (!isComplete && !isStart) {
                            TS.setTaskStart(innerTaskId);
                            break;
                        }
                    }
                }
            }
        });
        innerTasksCursor.get().map((t) => t.id).forEach((innerTaskId) => {
            const prevTaskId = TS.getTaskPropertyCursor(innerTaskId, "previousSequentialTaskId").get();
            if (!_.isEmpty(prevTaskId)) {
                TS.getTaskPropertyCursor(prevTaskId, "complete").on("update", (e) => {
                    if (e.data === true) {
                        //todo: remove logs.
                        console.log(`Prev task ${prevTaskId} completed, now starting ${innerTaskId}`);
                        TS.setTaskStart(innerTaskId);
                    }
                });
            }
        });
    }

    initialize(newTasks) {
        super.initialize(newTasks);
        this._setHooks(newTasks.map((t) => t.id));
        this._registerWorkflow();
        this._registerComplete();
    }

    execute() {
        TS.setTaskStart(this.id);
        return Promise.resolve();
    }
}

export default SequentialTask;