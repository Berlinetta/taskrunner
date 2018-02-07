import Promise from "bluebird";
import TaskRunner from "./TaskRunner/TaskRunner";
import BaseTask from "./TaskRunner/tasks/common/BaseTask";

class DemoClassBase extends BaseTask {
    constructor(id, param) {
        super(id, param);
        this.on("start", this.handleTaskStart);
        this.on("complete", this.handleTaskComplete);
        this.on("error", this.handleTaskComplete);
        this.name = this.getName();
        this.delayTime = this.getDelayTime();
    }

    getName() {
        return "";
    }

    getDelayTime() {
        return 0;
    }

    handleTaskError() {
        console.log(`${this.name} errored`);
    }

    handleTaskStart() {
        console.log(`${this.name} started`);
    }

    handleTaskComplete() {
        console.log(`${this.name} completed`);
    }

    execute() {
        return Promise.delay(this.delayTime).then(() => {
            return {name: this.name};
        });
    }
}

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

class Demos {
    demo1() {
        const TR = new TaskRunner();

        const AI = new A("AA", {info: "this is param"});
        const BI = new B("BB");
        const CI = new C("CC");
        const DI = new D("DD");
        const EI = new E("EE");

        TR.register(AI, BI, CI, DI, EI);
        TR.concurrent(AI, BI, CI);
        TR.sequential(AI, DI);
        TR.sequential(TR.compose(AI, BI, CI, DI), EI);

        TR.run().then((result) => {
            console.log("final!" + result);
        });
    }

    demo2() {
        const TR = new TaskRunner();

        const AI = new A("AA", {info: "this is param"});
        const BI = new B("BB");
        const CI = new C("CC");
        const DI = new D("DD");
        const EI = new E("EE");
        const HI = new H("HH");
        const OI = new O("OO");
        const JI = new J("JJ");
        const LI = new L("LL");
        const MI = new M("MM");

        TR.register(AI, BI, CI, DI, EI, HI, OI, JI, LI, MI);
        TR.concurrent(AI, BI, CI);
        TR.sequential(AI, DI);

        TR.sequential(HI, OI);
        TR.sequential(JI, LI, MI);
        TR.concurrent(HI, JI);
        TR.sequential(TR.compose(AI, BI, CI, DI), EI, TR.compose(HI, OI, JI, LI, MI));

        TR.run();

    }

    demo3() {
        const TR = new TaskRunner();

        const AI = new A("AA", {info: "this is param"});
        const BI = new B("BB");
        const CI = new C("CC");
        const DI = new D("DD");
        const EI = new E("EE");
        const HI = new H("HH");
        const OI = new O("OO");
        const JI = new J("JJ");
        const LI = new L("LL");
        const MI = new M("MM");

        TR.register(AI, BI, CI, DI, EI, HI, OI, JI, LI, MI);
        TR.concurrent(AI, BI, CI);
        TR.sequential(AI, JI);
        TR.concurrent(JI, LI);
        TR.sequential(LI, MI);
        TR.sequential(BI, DI);
        TR.concurrent(DI, EI, HI);
        TR.sequential(TR.compose(CI, EI, HI), OI);
        TR.run();

    }

    demo4() {
        const TR = new TaskRunner();

        const AI = new A("AA", {info: "this is param"});
        const BI = new B("BB");
        const CI = new C("CC");
        const DI = new D("DD");
        const EI = new E("EE");
        const HI = new H("HH");
        const OI = new O("OO");
        const JI = new J("JJ");
        const LI = new L("LL");
        const MI = new M("MM");

        TR.register(AI, BI, CI, DI, EI, HI, OI, JI, LI, MI);
        TR.sequential(HI, OI, JI, LI, MI, AI, BI, CI, DI, EI);

        TR.run();
    }
}

const demo = new Demos();

export default function (n) {
    demo[`demo${n}`]();
}