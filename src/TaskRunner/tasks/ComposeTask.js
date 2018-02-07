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

    updateNavigationFields(internalTaskIds) {
        internalTaskIds.forEach((taskId) => {
            this.assertTaskExists(taskId);
            TS.getTaskCursorById(taskId).select("parentComposedTaskId").set(this.id);
        });
    }

    initialize(newTasks) {
        super.initialize(newTasks);
        this.updateNavigationFields(newTasks.map((t) => t.id));
        this.registerStartEvent();
        this.handleTaskComplete();
    }

    execute() {
        const initTaskIds = TES.getInitialTaskIdsForComposedTask(this.id);
        TES.runTasks(initTaskIds);
        this.setStartFlag(this.id);
        return Promise.resolve();
    }
}

export default ComposeTask;