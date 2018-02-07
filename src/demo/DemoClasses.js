import Promise from "bluebird";
import DemoClassBase from "./DemoClassBase";

class A extends DemoClassBase {
    getName() {
        return "AAA";
    }

    execute(parameter, store) {
        this.store = store;
        return Promise.resolve({name: this.name});
    }
}

class B extends DemoClassBase {
    getName() {
        return "BBB";
    }

    getDelayTime() {
        return 3000;
    }
}

class C extends DemoClassBase {
    getName() {
        return "CCC";
    }
}

class D extends DemoClassBase {
    getName() {
        return "DDD";
    }

    getDelayTime() {
        return 5000;
    }
}

class E extends DemoClassBase {
    getName() {
        return "EEE";
    }

    getDelayTime() {
        return 2000;
    }
}

class H extends DemoClassBase {
    getName() {
        return "HHH";
    }
}

class O extends DemoClassBase {
    getName() {
        return "OOO";
    }
}

class J extends DemoClassBase {
    getName() {
        return "JJJ";
    }
}

class L extends DemoClassBase {
    getName() {
        return "LLL";
    }
}

class M extends DemoClassBase {
    getName() {
        return "MMM";
    }
}

export {A, B, C, D, E, H, O, J, L, M};