import _ from "lodash";
import Promise from "bluebird";
import TaskExecutionService from "../../services/TaskExecutionService";
import TaskUtils from "./TaskUtils";
import BaseTask from "./BaseTask";
import {TaskStatus} from "../../Models";

const TU = new TaskUtils();
const TES = new TaskExecutionService();

class InternalTaskBase extends BaseTask {
    constructor(id, taskType, store) {
        super(id);
        this.taskType = null;
        this.store = store;
        this.handleSuccessResults = TU.handleSuccessResults.bind(this);
        this.handleErrorResults = TU.handleErrorResults.bind(this);
    }

    _triggerTaskEvent(taskCursor, eventType) {
        const handlers = taskCursor.select("eventHandlers").get();
        const taskHandlers = _.isArray(handlers) ? handlers : {};
        const handlerObj = taskHandlers.find((e) => e.event === eventType);
        if (handlerObj && _.isFunction(handlerObj.handler)) {
            //todo: param?
            handlerObj.handler();
        }
    }

    _registerUserTaskEvents(taskCursor) {
        taskCursor.select("start").on("update", (e) => {
            if (e && e.data) {
                this._triggerTaskEvent(taskCursor, "start");
            }
        });
        taskCursor.select("complete").on("update", (e) => {
            if (e && e.data) {
                this._triggerTaskEvent(taskCursor, "complete");
            }
        });
        taskCursor.select("error").on("update", (e) => {
            if (e && e.data) {
                this._triggerTaskEvent(taskCursor, "error");
            }
        });
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

    initialize(tasksCursor, newTasks) {
        tasksCursor.select(this.id).set(new TaskStatus(this.id, null, this.taskType, newTasks, [], this.execute, this));
        this._registerUserTaskEvents(tasksCursor.select(this.id));
    }
}

export default InternalTaskBase;