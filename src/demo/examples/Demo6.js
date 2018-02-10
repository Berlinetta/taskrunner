import {A, B, C, D, E, H, J, L, M, O} from "../DemoClasses";
import TaskRunner from "../../TaskRunner/TaskRunner";

export default () => {
    const TR = new TaskRunner();

    const AI = new A("AA", {info: "this is param"}, true);
    const BI = new B("BB", null, true);
    const CI = new C("CC", null, true);
    const DI = new D("DD", null, true);
    const EI = new E("EE", null, true);
    const HI = new H("HH", null, true);
    const OI = new O("OO", null, true);
    const JI = new J("JJ", null, true);
    const LI = new L("LL", null, true);
    const MI = new M("MM", null, true);

    TR.register(AI, BI, CI, DI, EI, HI, OI, JI, LI, MI);
    TR.compose(MI, LI, AI, OI, JI, DI, BI, CI, HI, EI);

    TR.run().then((result) => {
        console.log("final!" + result);
    });
};