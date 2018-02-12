import _ from "lodash";
import Promise from "bluebird";
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
        const eventsMapping = {
            running: "start",
            complete: "complete",
            error: "error"
        };
        _.keys(eventsMapping).forEach((key) => {
            TS.getTaskCursorById(this.id).select(key).on("update", (e) => {
                if (e && e.data) {
                    this._triggerTaskEvent(eventsMapping[key]);
                }
            });
        });
    }

    initialize(userTask) {
        const {id, param, handlers, execute} = userTask;
        _.assign(this, {id, param, handlers});
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
        TS.setTaskStart(this.id);
        const normalValues = TS.getNormalTasks().map((t) => {
            return {id: t.id, promise: t.promise};
        });
        const userTaskPromise = this.userTaskExec(this.param, normalValues);
        if (_.isEmpty(userTaskPromise)) {
            return Promise.reject(new Error(`Error: execution promise of task:${this.id} is empty.`))
                .catch(_.partial(TU.handleErrorResults, this.id));
        }
        if (!(userTaskPromise instanceof Promise)) {
            return Promise.resolve(userTaskPromise).then(_.partial(TU.handleSuccessResults, this.id));
        }
        return userTaskPromise.then(_.partial(TU.handleSuccessResults, this.id))
            .catch(_.partial(TU.handleErrorResults, this.id));
    }
}

export default NormalTask;