import {A, B, C, D, E, H, J, L, M, O} from "../DemoClasses";
import TaskRunner from "../../TaskRunner/TaskRunner";

export default () => {
    const TR = new TaskRunner();

    const AI = new A("AA", {info: "this is param"}, true);
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
    TR.sequential(TR.composite(AI, BI, CI, DI), EI, TR.composite(HI, OI, JI, LI, MI));

    TR.run().then((result) => {
        console.log("Demo2 final!" + result);
    });
};