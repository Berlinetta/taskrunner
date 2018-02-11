import _ from "lodash";
import Promise from "bluebird";
import {TaskTypes} from "../common/Constants";
import TS from "./TreeService";

class TaskExecutionService {
    constructor() {
        //todo: remove count.
        this.count = 0;
    }

    _runExecute(taskId) {
        const taskCursor = TS.getTaskCursorById(taskId);
        const promiseCursor = taskCursor.select("promise");
        let exec = taskCursor.select("execute").get();
        exec = exec.bind(taskCursor.select("instance").get());
        let promise = promiseCursor.get();
        if (_.isNil(promise)) {
            promise = exec();
            TS.setTaskProperty(taskId, true, "running");
            promiseCursor.set(promise);
        }
    }

    runTasks(taskIds) {
        if (taskIds.length === 0) {
            //todo: reformat error handling.
            throw new Error("Error: No task ids found when running tasks.");
        }
        taskIds.forEach((taskId) => {
            TS.setTaskStart(taskId);
        });
    }

    _getTaskRunnerPromise() {
        //todo: remove count.
        this.count++;
        console.log(this.count);
        if (this.count === 100) {
            return Promise.resolve();
        }
        const promises = TS.getTasks().map((t) => t.promise);
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
            return TS.getNormalTasks().map((t, i) => {
                if (_.isArray(results) && results.length > i) {
                    return results[i];
                }
                return null;
            });
        });
    }

    getInitialTaskIds() {
        return _.filter(TS.getNormalTasks(), (t) => t.isInitialTask).map((t) => t.id);
    }

    getInitialTaskIdsForComposedTask(taskId) {
        const innerTasks = TS.getTaskPropertyCursor(taskId, "innerTasks").get();
        const filteredTasks = _.filter(innerTasks, (task) => {
            const taskCursor = TS.getTaskCursorById(task.id);
            return _.isEmpty(taskCursor.select("parentConcurrentTaskId").get())
                && _.isEmpty(taskCursor.select("previousSequentialTaskId").get());
        });
        return filteredTasks.map((t) => t.id);
    }

    updateGlobalDependencies() {
        const builtinTasks = TS.getBuiltinTasks();
        const composedTasks = _.filter(builtinTasks, (t) => t.taskType === TaskTypes.Composed);
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

    registerStart() {
        TS.getTaskIds().forEach((id) => {
            TS.getTaskPropertyCursor(id, "start").on("update", (e) => {
                if (e.data !== true) {
                    return;
                }
                const currentTask = TS.getTaskById(id);
                if (!_.isEmpty(currentTask.parentSequentialTaskId)) {
                    const parentSeqTask = TS.getTaskById(currentTask.parentSequentialTaskId);
                    if (!parentSeqTask.start) {
                        TS.setTaskStart(id, false);
                        TS.setTaskStart(parentSeqTask.id);
                        return;
                    }
                }
                if (!_.isEmpty(currentTask.parentConcurrentTaskId)) {
                    const parentConTask = TS.getTaskById(currentTask.parentConcurrentTaskId);
                    if (!parentConTask.start) {
                        TS.setTaskStart(id, false);
                        TS.setTaskStart(parentConTask.id);
                        return;
                    }
                }
                this._runExecute(id);
            });
        });
    }
}

const instance = new TaskExecutionService();

export default instance;