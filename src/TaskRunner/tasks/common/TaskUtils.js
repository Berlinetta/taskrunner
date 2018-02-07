import _ from "lodash";
import Promise from "bluebird";
import TS from "../../services/TreeService";

class TaskUtils {
    handleSuccessResults(taskId, result) {
        TS.getTaskCursorById(taskId)
            .select("result").set(result)
            .select("complete").set(true);
        return Promise.resolve(result);
    }

    handleErrorResults(taskId, err) {
        TS.getTaskCursorById(taskId)
            .select("errorMessages").set(_.isArray(err) ? err : [err])
            .select("complete").set(true)
            .select("error").set(true);
        return Promise.resolve(err);
    }
}

export default TaskUtils;