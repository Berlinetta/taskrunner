import _ from "lodash";
import Promise from "bluebird";

class Utils {
    handleSuccessResults(taskCursor, result) {
        taskCursor.select("result").set(result);
        taskCursor.select("complete").set(true);
        return Promise.resolve(result);
    }


}

export default Utils;