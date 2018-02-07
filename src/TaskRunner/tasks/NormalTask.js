import _ from "lodash";
import BaseTask from "./common/BaseTask";
import {TaskStatus, TaskTypes} from "../Models";
import TaskUtils from "./common/TaskUtils";

const TU = new TaskUtils();

class NormalTask extends BaseTask {
    constructor(store) {
        super();
        this.taskType = TaskTypes.Normal;
        this.store = store;
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
        this.store.select("tasks", id).set(status);
    }

    //todo: don't pass store to normal task.
    execute(param, store) {
        const taskCursor = store.select("tasks", this.id);
        return this.userTaskExec(param, store)
            .then(_.partial(TU.handleSuccessResults, taskCursor))
            .catch(_.partial(TU.handleErrorResults, taskCursor));
    }
}

export default NormalTask;