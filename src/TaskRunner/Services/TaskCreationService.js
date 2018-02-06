import _ from "lodash";
import {TaskTypes, TaskStatus} from "../Models";
import ConcurrentTask from "../InternalTasks/ConcurrentTask";
import SequentialTask from "../InternalTasks/SequentialTask";
import ComposeTask from "../InternalTasks/ComposeTask";
import Utils from "../Utils";
import Promise from "bluebird";

const utils = new Utils();

class TaskCreationService {
    handleErrorResults(taskCursor, err) {
        taskCursor.select("errorMessages").set(_.isArray(err) ? err : [err]);
        taskCursor.select("complete").set(true);
        taskCursor.select("error").set(true);
        return Promise.resolve(err);
    }

    _triggerTaskEvent(taskHandlers, eventType) {
        const handlerObj = taskHandlers.find((e) => e.event === eventType);
        if (handlerObj && _.isFunction(handlerObj.handler)) {
            handlerObj.handler();
        }
    }

    _getTaskHandlers(taskCursor) {
        const handlers = taskCursor.select("eventHandlers").get();
        return _.isArray(handlers) ? handlers : {};
    }

    _registerUserTaskEvents(taskCursor) {
        taskCursor.select("start").on("update", (e) => {
            if (e && e.data) {
                this._triggerTaskEvent(this._getTaskHandlers(taskCursor), "start");
            }
        });
        taskCursor.select("complete").on("update", (e) => {
            if (e && e.data) {
                this._triggerTaskEvent(this._getTaskHandlers(taskCursor), "complete");
            }
        });
        taskCursor.select("error").on("update", (e) => {
            if (e && e.data) {
                this._triggerTaskEvent(this._getTaskHandlers(taskCursor), "error");
            }
        });
    }

    createNormalTasks(newTasks, tasksCursor) {
        const tasks = tasksCursor.get();
        newTasks.forEach((t) => {
            t.handlers.forEach((obj) => {
                if (_.isFunction(obj.handler)) {
                    obj.handler = obj.handler.bind(t);
                }
            });
            tasks[t.id] = new TaskStatus(t.id, t.param, TaskTypes.Normal, [], t.handlers, t.execute, t);
        });
        tasksCursor.set(tasks);
        newTasks.forEach((t) => {
            this._registerUserTaskEvents(tasksCursor.select(t.id));
        });
    }

    createBuiltinTask(store, newTasks, taskType) {
        const tasksCursor = store.select("tasks");
        const tasks = tasksCursor.get();



        tasks[this.id] = new TaskStatus(this.id, null, taskType, newTasks, [], this.execute, this);
        tasksCursor.set(tasks);
        this._registerUserTaskEvents(tasksCursor.select(this.id));
    }

    createNewConcurrentTask(newTasks, tasksCursor) {
        const conTask = new ConcurrentTask(tasksCursor.tree);
        conTask.initialize(newTasks);
    }

    createNewSequentialTask(newTasks, tasksCursor) {
        const seqTask = new SequentialTask(tasksCursor.tree);
        this.createBuiltinTask(tasksCursor.tree, newTasks, TaskTypes.Sequential);
        seqTask.initialize(newTasks);
    }

    createNewComposeTask(newTasks, tasksCursor) {
        const comTask = new ComposeTask(tasksCursor.tree);
        comTask.initialize(newTasks);
        return comTask;
    }

    updateGlobalDependencies(store) {
        const tasksCursor = store.select("tasks");
        const tasks = tasksCursor.get();
        const builtinTasks = _.filter(tasks, (t) => t.taskType !== TaskTypes.Normal);
        const composedTasks = _.filter(tasks, (t) => t.taskType === TaskTypes.Composed);
        builtinTasks.forEach((builtinTask) => {
            const innerTaskIds = builtinTask.innerTasks.map((t) => t.id);
            composedTasks.forEach((composedTask) => {
                if (builtinTask.id !== composedTask.id) {
                    const composedTaskInnerTaskIds = composedTask.innerTasks.map((t) => t.id);
                    let needToUpdate = true;
                    innerTaskIds.forEach((innerId) => {
                        needToUpdate = needToUpdate && _.includes(composedTaskInnerTaskIds, innerId);
                    });
                    if (needToUpdate) {
                        builtinTask.parentComposedTaskId = composedTask.id;
                        composedTask.innerTasks.push(builtinTask);
                    }
                }
            });
        });
    }
}

export default TaskCreationService;