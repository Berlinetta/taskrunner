import {A, B, C, D, E} from "../DemoClasses";
import TaskRunner from "../../TaskRunner/TaskRunner";

export default () => {
    const TR = new TaskRunner();

    const AI = new A("AA", {info: "this is param"}, true);
    const BI = new B("BB");
    const CI = new C("CC", null, true);
    const DI = new D("DD");
    const EI = new E("EE");

    TR.register(AI, BI, CI, DI, EI);
    TR.concurrent(AI, BI, CI);
    TR.sequential(AI, DI);
    TR.sequential(TR.compose(AI, BI, CI, DI), EI);

    TR.run().then((result) => {
        console.log("Demo1 final!" + result);
    });
};