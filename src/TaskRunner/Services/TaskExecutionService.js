import _ from "lodash";
import Promise from "bluebird";
import {TaskTypes} from "../Models";
import Utils from "../Utils";

const utils = new Utils();

class TaskExecutionService {
    constructor() {
        //todo: remove count.
        this.count = 0;
    }

    _getExecutionPromise(taskCursor) {
        const promiseCursor = taskCursor.select("promise");
        let exec = taskCursor.select("execute").get();
        exec = exec.bind(taskCursor.select("instance").get());
        let promise = promiseCursor.get();
        if (_.isNil(promise)) {
            promise = exec(taskCursor.select("param").get(), taskCursor.tree);
            promiseCursor.set(promise);
        }
        return promise;
    }

    runTask(taskId, store) {
        const taskCursor = store.select("tasks", taskId);
        taskCursor.select("start").set(true);
        const taskPromise = this._getExecutionPromise(taskCursor);
        //no need handler for internal tasks.
        if (taskCursor.select("taskType").get() === TaskTypes.Normal) {
            taskPromise.then(_.partial(utils.handleSuccessResults, taskCursor))
                .catch(_.partial(utils.handleErrorResults, taskCursor));
        }
    }

    runTasks(taskIds, store) {
        taskIds.forEach((taskId) => {
            this.runTask(taskId, store);
        });
    }

    _getTasks(store) {
        return _.values(store.select("tasks").get());
    }

    _getTaskRunnerPromise(store) {
        this.count++;
        const promises = this._getTasks(store).map((t) => t.promise);
        const emptyPromises = _.filter(promises, (p) => _.isEmpty(p));
        if (emptyPromises.length === 0) {
            return Promise.all(promises);
        } else {
            return Promise.all(promises).then(() => {
                return this._getTaskRunnerPromise(store);
            });
        }
    }

    getTaskRunnerPromise(store) {
        return this._getTaskRunnerPromise(store).then((results) => {
            console.log("_getTaskRunnerPromise count:" + this.count);
            const taskResults = [];
            this._getTasks(store).forEach((t, i) => {
                if (t.taskType === TaskTypes.Normal) {
                    taskResults.push(results[i]);
                }
            });
            return taskResults;
        });
    }

    getInitialTaskIds(tasksCursor) {
        const tasks = tasksCursor.get();
        const filteredTasks = _.filter(tasks, (task) => {
            if (task.taskType === TaskTypes.Concurrent && _.isEmpty(task.previousSequentialTaskId)
                && !_.some(task.innerTasks, (innerTask) => {
                    return !_.isEmpty(tasksCursor.select(innerTask.id, "previousSequentialTaskId").get());
                })) {
                return false;
            }
            if (task.taskType === TaskTypes.Sequential && task.innerTasks.length > 0
                && !_.isEmpty(tasksCursor.select(task.innerTasks[0].id, "parentConcurrentTaskId").get())) {
                return false;
            }
            return _.isEmpty(task.parentComposedTaskId) && _.isEmpty(task.parentConcurrentTaskId)
                && _.isEmpty(task.previousSequentialTaskId);
        });
        return filteredTasks.map((t) => t.id);
    }

    getInitialTaskIdsForComposedTask(composedTaskCursor) {
        const innerTasks = composedTaskCursor.select("innerTasks").get();
        const filteredTasks = _.filter(innerTasks, (task) => {
            const taskCursor = composedTaskCursor.tree.select("tasks", task.id);
            return _.isEmpty(taskCursor.select("parentConcurrentTaskId").get())
                && _.isEmpty(taskCursor.select("previousSequentialTaskId").get());
        });
        return filteredTasks.map((t) => t.id);
    }
}

export default TaskExecutionService;