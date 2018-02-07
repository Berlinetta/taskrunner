import _ from "lodash";
import Promise from "bluebird";
import {TaskTypes} from "../common/Constants";
import TS from "./TreeService";

class TaskExecutionService {
    constructor() {
        //todo: remove count.
        this.count = 0;
    }

    _getExecutionPromise(taskId) {
        const taskCursor = TS.getTaskCursorById(taskId);
        const promiseCursor = taskCursor.select("promise");
        let exec = taskCursor.select("execute").get();
        exec = exec.bind(taskCursor.select("instance").get());
        let promise = promiseCursor.get();
        if (_.isNil(promise)) {
            promise = exec(taskCursor.select("param").get());
            promiseCursor.set(promise);
        }
        return promise;
    }

    runTask(taskId) {
        TS.getTaskCursorById(taskId).select("start").set(true);
        return this._getExecutionPromise(taskId);
    }

    runTasks(taskIds) {
        return taskIds.map((taskId) => {
            return this.runTask(taskId);
        });
    }

    _getTaskRunnerPromise() {
        //todo: remove count.
        this.count++;
        console.log(this.count);
        if (this.count === 100) {
            return Promise.resolve();
        }
        const promises = _.values(TS.getTasks()).map((t) => t.promise);
        const emptyPromises = _.filter(promises, (p) => _.isEmpty(p));
        if (emptyPromises.length === 0) {
            return Promise.all(promises);
        } else {
            return Promise.all(promises).then(() => {
                return this._getTaskRunnerPromise();
            });
        }
    }

    getTaskRunnerPromise() {
        return this._getTaskRunnerPromise().then((results) => {
            console.log("_getTaskRunnerPromise count:" + this.count);
            const taskResults = [];
            _.values(TS.getTasks()).forEach((t, i) => {
                if (t.taskType === TaskTypes.Normal) {
                    taskResults.push(results[i]);
                }
            });
            return taskResults;
        });
    }

    getInitialTaskIds() {
        const filteredTasks = _.filter(TS.getTasks(), (task) => {
            if (task.taskType === TaskTypes.Concurrent && _.isEmpty(task.previousSequentialTaskId)
                && _.some(task.innerTasks, (innerTask) => {
                    return !_.isEmpty(TS.getTaskCursorById(innerTask.id).select("previousSequentialTaskId").get());
                })) {
                return false;
            }
            if (task.taskType === TaskTypes.Sequential && task.innerTasks.length > 0
                && !_.isEmpty(TS.getTaskCursorById(task.innerTasks[0].id).select("parentConcurrentTaskId").get())) {
                return false;
            }
            return _.isEmpty(task.parentComposedTaskId) && _.isEmpty(task.parentConcurrentTaskId)
                && _.isEmpty(task.previousSequentialTaskId);
        });
        return filteredTasks.map((t) => t.id);
    }

    getInitialTaskIdsForComposedTask(taskId) {
        const innerTasks = TS.getTaskCursorById(taskId).select("innerTasks").get();
        const filteredTasks = _.filter(innerTasks, (task) => {
            const taskCursor = TS.getTaskCursorById(task.id);
            return _.isEmpty(taskCursor.select("parentConcurrentTaskId").get())
                && _.isEmpty(taskCursor.select("previousSequentialTaskId").get());
        });
        return filteredTasks.map((t) => t.id);
    }

    updateGlobalDependencies() {
        const tasks = TS.getTasks();
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

const instance = new TaskExecutionService();

export default instance;