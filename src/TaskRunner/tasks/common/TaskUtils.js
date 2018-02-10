import _ from "lodash";
import Promise from "bluebird";
import TS from "../../services/TreeService";

class TaskUtils {
    handleSuccessResults(taskId, result) {
        const taskCursor = TS.getTaskCursorById(taskId);
        taskCursor.select("result").set(result);
        taskCursor.select("complete").set(true);
        return Promise.resolve(result);
    }

    handleErrorResults(taskId, err) {
        const taskCursor = TS.getTaskCursorById(taskId);
        taskCursor.select("errorMessages").set(_.isArray(err) ? err : [err]);
        taskCursor.select("complete").set(true);
        taskCursor.select("error").set(true);
        return Promise.resolve(err);
    }

    setStartFlag(taskId, isStart = true) {
        const startCursor = TS.getTaskCursorById(taskId).select("start");
        if (!startCursor.get()) {
            startCursor.set(isStart);
        }
    }
}

const instance = new TaskUtils();

export default instance;