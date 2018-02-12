import _ from "lodash";

const EventType = {
    Builtin: "Builtin",
    Custom: "Custom"
};

const BuiltinEvents = {
    update: "update",
    get: "get",
    fetch: "fetch"
};

class CursorEvent {
    constructor(eventName, handler, eventType, satisfier) {
        this.eventName = eventName;
        this.handler = handler;
        this.eventType = eventType;
        this.satisfier = satisfier;
    }
}

class EventArgs {
    constructor(data, cursor, path) {
        this.data = data;
        this.cursor = cursor;
        this.path = path;
    }
}

class Assert {
    static isString(str) {
        if (!_.isString(str)) {
            throw new TypeError(`Error: ${str} is not a string.`);
        }
    }

    static isFunction(func) {
        if (!_.isFunction(func)) {
            throw new TypeError(`Error: ${func} is not a function.`);
        }
    }
}

class CursorUtil {
    initCursorEvents(path, tree) {
        const handlerKey = path.join("_");
        if (!tree.eventsMap[handlerKey]) {
            tree.eventsMap[handlerKey] = [];
        }
    }

    getCursorEvents(path, tree) {
        return tree.eventsMap[path.join("_")];
    }

    setCursorEvents(path, tree, cursorEvents) {
        tree.eventsMap[path.join("_")] = cursorEvents;
    }

    getValueByPath(absolutePath, state) {
        if (absolutePath.length === 0) {
            return state;
        }
        const value = absolutePath.reduce((acc, val) => {
            if (acc === null || acc[val] === null || acc[val] === undefined) {
                return null;
            }

            return acc[val];
        }, state);

        return value;
    }

    getEventType(userEventName) {
        Assert.isString(userEventName);
        return _.some(_.keys(BuiltinEvents), (v) => v === userEventName.toLowerCase()) ?
            EventType.Builtin : EventType.Custom;
    }

    computeValue(cursor, paths, calculator) {
        const values = paths.map((p) => cursor.tree.select(...p).get());
        const newValue = calculator(...values);
        cursor.set(newValue);
    }
}

const CU = new CursorUtil();

class Cursor {
    constructor(state, path, tree) {
        this.state = state;
        this.path = path;
        this.tree = tree;
        CU.initCursorEvents(this.path, this.tree);
    }

    get(...args) {
        let path = [];
        if (args && args.length > 0) {
            path = this.path.concat([...args]);
        } else if (this.path.length > 0) {
            path = this.path;
        } else {
            return this.state;
        }
        const value = CU.getValueByPath(path, this.state);
        CU.getCursorEvents(this.path, this.tree).forEach((obj) => {
            if (obj.eventName === BuiltinEvents.get) {
                obj.handler(new EventArgs(value, this, this.path));
            }
        });
        return value;
    }

    set(newValue) {
        const clonedPath = [...this.path];
        let updated = false;
        if (clonedPath.length === 0) {
            if (!_.isEqual(this.state, newValue)) {
                this.state = newValue;
                updated = true;
            }
        } else {
            const lastPath = clonedPath.splice(clonedPath.length - 1, 1);
            const lastButOne = CU.getValueByPath(clonedPath, this.state);
            if (!_.isEqual(lastButOne[lastPath], newValue)) {
                lastButOne[lastPath] = newValue;
                updated = true;
            }
        }
        if (updated) {
            CU.getCursorEvents(this.path, this.tree).forEach((obj) => {
                if (obj.eventName === BuiltinEvents.update || (obj.eventType === EventType.Custom &&
                        _.isFunction(obj.satisfier) && obj.satisfier(newValue))) {
                    obj.handler(new EventArgs(newValue, this, this.path));
                }
            });
        }
        return this;
    }

    select(...args) {
        return new Cursor(this.state, this.path.concat([...args]), this.tree);
    }

    on(eventName, handler) {
        const cursorEvents = CU.getCursorEvents(this.path, this.tree);
        const eventType = CU.getEventType(eventName);
        if (eventType !== EventType.Custom) {
            cursorEvents.push(new CursorEvent(eventName.toLowerCase(), handler, eventType, null));
        } else {
            const customEventIndex = cursorEvents.findIndex((e) => e.eventName == eventName);
            if (customEventIndex < 0) {
                throw new Error(`Error: event ${eventName} is not registered.`);
            }
            cursorEvents[customEventIndex].handler = handler;
        }
        CU.setCursorEvents(this.path, this.tree, cursorEvents);
        return this;
    }

    off(eventName) {
        const cursorEvents = _.filter(CU.getCursorEvents(this.path, this.tree), (obj) => obj.eventName !== eventName);
        CU.setCursorEvents(this.path, this.tree, cursorEvents);
        return this;
    }

    fetch() {
        CU.getCursorEvents(this.path, this.tree).forEach((obj) => {
            if (obj.eventName === BuiltinEvents.fetch) {
                const newValue = obj.handler(new EventArgs(this.get(), this, this.path));
                this.set(newValue);
            }
        });
        return this;
    }

    addCustomEvent(eventName, satisfier) {
        Assert.isString(eventName);
        Assert.isFunction(satisfier);
        const cursorEvents = CU.getCursorEvents(this.path, this.tree);
        cursorEvents.push(new CursorEvent(eventName, null, EventType.Custom, satisfier));
        CU.setCursorEvents(this.path, this.tree, cursorEvents);
        return this;
    }

    computed(cursors, calculator) {
        const paths = cursors.map((c) => c.path);
        cursors.forEach((c) => {
            c.on("update", _.partial(CU.computeValue, this, paths, calculator));
        });
        return this;
    }
}

class StateTree {
    constructor(initialState) {
        this.state = initialState;
        this.eventsMap = {};
    }

    select(...args) {
        return new Cursor(this.state, [...args], this);
    }

    get() {
        return this.state;
    }
}

export default StateTree;