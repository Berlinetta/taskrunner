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