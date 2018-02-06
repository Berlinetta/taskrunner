import _ from "lodash";
import Promise from "bluebird";
import TaskExecutionService from "../Services/TaskExecutionService";
import Utils from "../Utils";
import {TaskStatus} from "../Models";

const utils = new Utils();
const TES = new TaskExecutionService();

class BaseTask {
    constructor(id, param) {
        this.id = id;
        this.param = param;
        this.handlers = [];
    }

    on(eventType, callback) {
        //todo: add dup check?
        this.handlers.push({event: eventType, handler: callback});
    }

    execute() {
    }
}

class InternalTaskBase extends BaseTask {
    constructor(id, store) {
        super(id);
        this.store = store;
        this.handleSuccessResults = utils.handleSuccessResults.bind(this);
        this.handleErrorResults = utils.handleErrorResults.bind(this);
    }

    assertTaskExists(tasks, taskId) {
        if (!_.isObject(tasks[taskId])) {
            throw new Error(`Task ${taskId} initialize failed.`);
        }
    }

    setStartFlag(taskId) {
        const startCursor = this.store.select("tasks", taskId, "start");
        if (!startCursor.get()) {
            startCursor.set(true);
        }
    }

    registerStartEvent(store) {
        const tasksCursor = store.select("tasks");
        const taskCursor = tasksCursor.select(this.id);
        const internalTaskIds = taskCursor.select("innerTasks").get().map((t) => t.id);
        internalTaskIds.forEach((id) => {
            tasksCursor.select(id, "start").on("update", (e) => {
                if (e.data === true) {
                    TES.runTask(id, store);
                    const parentConcurrentTaskId = store.select("tasks", id, "parentConcurrentTaskId").get();
                    if (!_.isEmpty(parentConcurrentTaskId)) {
                        TES.runTask(parentConcurrentTaskId, store);
                    }
                }
            });
        });
    }

    handleTaskComplete(store) {
        const taskCursor = store.select("tasks", this.id);
        const internalTaskIds = taskCursor.select("innerTasks").get().map((t) => t.id);
        const innerTaskCompleteCursors = internalTaskIds.map((id) => store.select("tasks", id, "complete"));
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
                const tree = taskCursor.tree;
                taskCursor.select("innerTasks").get().forEach((task) => {
                    const innerTaskCursor = tree.select("tasks", task.id);
                    error = error || innerTaskCursor.select("error").get();
                    errorMessages = errorMessages.concat(innerTaskCursor.select("errorMessages").get());
                    innerTaskPromises.push(innerTaskCursor.select("promise").get());
                });
                const taskPromise = Promise.all(innerTaskPromises);
                taskCursor.select("promise").set(taskPromise);
                if (error) {
                    this.handleErrorResults(taskCursor, errorMessages);
                } else {
                    this.handleSuccessResults(taskCursor, null);
                }
                taskPromise.then((result) => {
                    taskCursor.select("result").set(result);
                });
            }
        });
    }
}

export {BaseTask, InternalTaskBase};