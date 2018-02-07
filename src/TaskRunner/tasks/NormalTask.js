import _ from "lodash";
import BaseTask from "./common/BaseTask";
import TaskStatus from "./common/TaskStatus";
import {TaskTypes} from "../common/Constants";
import TU from "./common/TaskUtils";
import TS from "../services/TreeService";

class NormalTask extends BaseTask {
    constructor() {
        super();
        this.taskType = TaskTypes.Normal;
    }

    initialize(tasksCursor, userTask) {
        const {id, param, handlers, execute} = userTask;
        this.id = id;
        this.param = param;
        this.handlers = handlers;
        this.userTaskExec = execute.bind(userTask);
        handlers.forEach((obj) => {
            if (_.isFunction(obj.handler)) {
                obj.handler = obj.handler.bind(userTask);
            }
        });
        const status = new TaskStatus(id, param, TaskTypes.Normal, [], handlers, this.execute, userTask);
        TS.getTaskCursorById(id).set(status);
    }

    execute() {
        return this.userTaskExec(this.param)
            .then(_.partial(TU.handleSuccessResults, this.id))
            .catch(_.partial(TU.handleErrorResults, this.id));
    }
}

export default NormalTask;