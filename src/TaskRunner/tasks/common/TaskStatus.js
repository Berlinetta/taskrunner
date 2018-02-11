class TaskStatus {
    constructor(id, param, taskType, innerTasks, eventHandlers, execute, instance, isInitialTask = false) {
        this.id = id;
        this.param = param;
        this.taskType = taskType;
        this.innerTasks = innerTasks;
        this.eventHandlers = eventHandlers;
        this.execute = execute;
        this.instance = instance;
        this.isInitialTask = isInitialTask;
        this.promise = null;
        this.previousSequentialTaskId = null;
        this.parentSequentialTaskId = null;
        this.parentComposedTaskId = null;
        this.parentConcurrentTaskId = null;
        this.result = null;
        this.complete = false;
        this.error = false;
        this.errorMessages = [];
        this.start = false;
        this.running = false;
    }
}

export default TaskStatus;