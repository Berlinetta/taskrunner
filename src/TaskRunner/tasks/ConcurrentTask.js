import _ from "lodash";
import Promise from "bluebird";
import {TaskTypes} from "../common/Constants";
import InternalTaskBase from "./common/InternalTaskBase";
import TS from "../services/TreeService";

class ConcurrentTask extends InternalTaskBase {
    constructor() {
        super(_.uniqueId("concurrent_task_"), TaskTypes.Concurrent);
    }

    updateNavigationFields(internalTaskIds) {
        internalTaskIds.forEach((taskId) => {
            this.assertTaskExists(taskId);
            TS.getTaskCursorById(taskId).select("parentConcurrentTaskId").set(this.id);
        });
    }

    registerWorkflowEvents() {
        TS.getTaskCursorById(this.id).select("start").on("update", (e) => {
            if (e.data === true) {
                TS.getTaskCursorById(this.id).select("innerTasks").get().forEach((task) => {
                    this.setStartFlag(task.id);
                });
            }
        });
    }

    initialize(newTasks) {
        super.initialize(newTasks);
        this.updateNavigationFields(newTasks.map((t) => t.id));
        this.registerWorkflowEvents();
        this.registerStartEvent();
        this.handleTaskComplete();
    }

    execute() {
        this.setStartFlag(this.id);
        return Promise.resolve();
    }
}

export default ConcurrentTask;