import _ from "lodash";
import {TaskTypes} from "../common/Constants";

class TreeService {
    initialize(store) {
        this.store = store;
    }

    getStore() {
        return this.store;
    }

    getTasksCursor() {
        return this.store.select("tasks");
    }

    getTasks() {
        return _.values(this.getTasksCursor().get());
    }

    getTaskIds() {
        return this.getTasks().map((t) => t.id);
    }

    getTaskPropertyCursor(taskId, ...paths) {
        return this.getTaskCursorById(taskId).select(...paths);
    }

    getTaskPropertyValue(taskId, ...paths) {
        return this.getTaskPropertyCursor(taskId, ...paths).get();
    }

    setTaskProperty(taskId, propertyValue, ...paths) {
        this.getTaskPropertyCursor(taskId, ...paths).set(propertyValue);
    }

    setTaskStart(taskId, isStart = true) {
        this.setTaskProperty(taskId, isStart, "start");
    }

    getNormalTasks() {
        return _.filter(_.values(this.getTasksCursor().get()), (t) => t.taskType === TaskTypes.Normal);
    }

    getBuiltinTasks() {
        return _.filter(_.values(this.getTasksCursor().get()), (t) => t.taskType !== TaskTypes.Normal);
    }

    getTaskCursorById(taskId) {
        return this.getTasksCursor().select(taskId);
    }

    getTaskById(taskId) {
        return this.getTaskCursorById(taskId).get();
    }
}

const instance = new TreeService();

export default instance;