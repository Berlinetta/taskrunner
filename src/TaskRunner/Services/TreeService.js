class TreeService {
    initialize(store) {
        this.store = store;
    }

    getStore() {
        return this.store;
    }

    getTasksCursor() {
        return this.store.select("tasks");
    }

    getTasks() {
        return this.getTasksCursor().get();
    }

    getTaskCursorById(taskId) {
        return this.getTasksCursor().select(taskId);
    }

    getTaskById(taskId) {
        return this.getTaskCursorById(taskId).get();
    }
}

const instance = new TreeService();

export default instance;