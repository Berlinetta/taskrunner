import _ from "lodash";
import Promise from "bluebird";
import {TaskTypes} from "../common/Constants";
import InternalTaskBase from "./common/InternalTaskBase";
import TES from "../services/TaskExecutionService";
import TS from "../services/TreeService";

class CompositeTask extends InternalTaskBase {
    constructor() {
        super(_.uniqueId("composite_task_"), TaskTypes.Composite);
    }

    _setHooks(internalTaskIds) {
        internalTaskIds.forEach((taskId) => {
            this.assertTaskExists(taskId);
            TS.getTaskCursorById(taskId).select("parentCompositeTaskId").set(this.id);
        });
    }

    initialize(newTasks) {
        super.initialize(newTasks);
        this._setHooks(newTasks.map((t) => t.id));
        this._registerComplete();
    }

    execute() {
        const initTaskIds = TES.getInitialTaskIdsForCompositeTask(this.id);
        TES.runTasks(initTaskIds);
        TS.setTaskStart(this.id);
        return Promise.resolve();
    }
}

export default CompositeTask;