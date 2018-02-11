import _ from "lodash";
import Promise from "bluebird";
import TS from "../../services/TreeService";

class TaskUtils {
    handleSuccessResults(taskId, result) {
        const taskCursor = TS.getTaskCursorById(taskId);
        taskCursor.select("result").set(result);
        taskCursor.select("running").set(false);
        taskCursor.select("complete").set(true);
        return Promise.resolve(result);
    }

    handleErrorResults(taskId, err) {
        const taskCursor = TS.getTaskCursorById(taskId);
        taskCursor.select("errorMessages").set(_.isArray(err) ? err : [err]);
        taskCursor.select("running").set(false);
        taskCursor.select("complete").set(true);
        taskCursor.select("error").set(true);
        return Promise.resolve(err);
    }
}

const instance = new TaskUtils();

export default instance;