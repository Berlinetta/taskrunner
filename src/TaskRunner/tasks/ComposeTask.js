import _ from "lodash";
import Promise from "bluebird";
import {TaskTypes} from "../common/Constants";
import InternalTaskBase from "./common/InternalTaskBase";
import TES from "../services/TaskExecutionService";
import TS from "../services/TreeService";

class ComposeTask extends InternalTaskBase {
    constructor() {
        super(_.uniqueId("compose_task_"), TaskTypes.Composed);
    }

    _setHooks(internalTaskIds) {
        internalTaskIds.forEach((taskId) => {
            this.assertTaskExists(taskId);
            TS.getTaskCursorById(taskId).select("parentComposedTaskId").set(this.id);
        });
    }

    initialize(newTasks) {
        super.initialize(newTasks);
        this._setHooks(newTasks.map((t) => t.id));
        this._registerComplete();
    }

    execute() {
        const initTaskIds = TES.getInitialTaskIdsForComposedTask(this.id);
        TES.runTasks(initTaskIds);
        TS.setTaskStart(this.id);
        return Promise.resolve();
    }
}

export default ComposeTask;