import _ from "lodash";
import Promise from "bluebird";

class TaskUtils {
    handleSuccessResults(taskCursor, result) {
        taskCursor.select("result").set(result);
        taskCursor.select("complete").set(true);
        return Promise.resolve(result);
    }

    handleErrorResults(taskCursor, err) {
        taskCursor.select("errorMessages").set(_.isArray(err) ? err : [err]);
        taskCursor.select("complete").set(true);
        taskCursor.select("error").set(true);
        return Promise.resolve(err);
    }
}

export default TaskUtils;