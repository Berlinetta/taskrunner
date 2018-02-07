import _ from "lodash";
import Promise from "bluebird";
import BaseTask from "./BaseTask";
import TaskStatus from "./TaskStatus";
import TES from "../../services/TaskExecutionService";
import TU from "./TaskUtils";
import TS from "../../services/TreeService";

class InternalTaskBase extends BaseTask {
    constructor(id, taskType) {
        super(id);
        this.taskType = taskType;
        this.handleSuccessResults = TU.handleSuccessResults.bind(this);
        this.handleErrorResults = TU.handleErrorResults.bind(this);
    }

    assertTaskExists(taskId) {
        if (!_.isObject(TS.getTasks()[taskId])) {
            throw new Error(`Task ${taskId} initialize failed.`);
        }
    }

    setStartFlag(taskId) {
        const startCursor = TS.getTaskCursorById(taskId).select("start");
        if (!startCursor.get()) {
            startCursor.set(true);
        }
    }

    registerStartEvent() {
        const internalTaskIds = TS.getTaskCursorById(this.id).select("innerTasks").get().map((t) => t.id);
        internalTaskIds.forEach((id) => {
            TS.getTasksCursor().select(id, "start").on("update", (e) => {
                if (e.data === true) {
                    TES.runTask(id);
                    const parentConcurrentTaskId = TS.getTaskCursorById(id).select("parentConcurrentTaskId").get();
                    if (!_.isEmpty(parentConcurrentTaskId)) {
                        TES.runTask(parentConcurrentTaskId);
                    }
                }
            });
        });
    }

    handleTaskComplete() {
        const taskCursor = TS.getTaskCursorById(this.id);
        const internalTaskIds = taskCursor.select("innerTasks").get().map((t) => t.id);
        const innerTaskCompleteCursors = internalTaskIds.map((id) => TS.getTaskCursorById(id).select("complete"));
        taskCursor.select("complete").computed(innerTaskCompleteCursors, (...results) => {
            return _.reduce(results, (re, complete) => {
                return _.isBoolean(complete) ? re && complete : false;
            }, true);
        });
        taskCursor.select("complete").on("update", (e) => {
            if (e.data === true) {
                const innerTaskPromises = [];
                let error = false;
                let errorMessages = [];
                taskCursor.select("innerTasks").get().forEach((task) => {
                    const innerTaskCursor = TS.getTaskCursorById(task.id);
                    error = error || innerTaskCursor.select("error").get();
                    errorMessages = errorMessages.concat(innerTaskCursor.select("errorMessages").get());
                    innerTaskPromises.push(innerTaskCursor.select("promise").get());
                });
                const taskPromise = Promise.all(innerTaskPromises);
                taskCursor.select("promise").set(taskPromise);
                if (error) {
                    this.handleErrorResults(this.id, errorMessages);
                } else {
                    this.handleSuccessResults(this.id, null);
                }
                taskPromise.then((result) => {
                    taskCursor.select("result").set(result);
                });
            }
        });
    }

    initialize(newTasks) {
        const status = new TaskStatus(this.id, null, this.taskType, newTasks, [], this.execute, this);
        TS.getTaskCursorById(this.id).set(status);
    }
}

export default InternalTaskBase;