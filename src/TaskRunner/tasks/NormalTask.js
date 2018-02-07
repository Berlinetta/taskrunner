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

    _triggerTaskEvent(eventType) {
        const handlers = TS.getTaskCursorById(this.id).select("eventHandlers").get();
        const taskHandlers = _.isArray(handlers) ? handlers : [];
        const handlerObj = taskHandlers.find((e) => e.event === eventType);
        if (handlerObj && _.isFunction(handlerObj.handler)) {
            //todo: param?
            handlerObj.handler();
        }
    }

    _registerUserTaskEvents() {
        const events = ["start", "complete", "error"];
        events.forEach((eventType) => {
            TS.getTaskCursorById(this.id).select(eventType).on("update", (e) => {
                if (e && e.data) {
                    this._triggerTaskEvent(eventType);
                }
            });
        });
    }

    initialize(userTask) {
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
        const status = new TaskStatus(id, param, TaskTypes.Normal, [], handlers, this.execute, this);
        TS.getTaskCursorById(id).set(status);
        this._registerUserTaskEvents();
    }

    execute() {
        return this.userTaskExec(this.param)
            .then(_.partial(TU.handleSuccessResults, this.id))
            .catch(_.partial(TU.handleErrorResults, this.id));
    }
}

export default NormalTask;