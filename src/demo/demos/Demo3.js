import {A, B, C, D, E, H, J, L, M, O} from "../DemoClasses";
import TaskRunner from "../../TaskRunner/TaskRunner";

export default () => {
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

    const conTask = TR.concurrent(AI, BI, CI);
    TR.sequential(AI, JI);
    TR.concurrent(JI, LI);
    TR.sequential(LI, MI);
    TR.sequential(BI, DI);
    TR.concurrent(DI, EI, HI);
    TR.sequential(TR.composite(CI, EI, HI), OI);
    TR.run(conTask.id).then((result) => {
        console.log("Demo3 final!" + result);
    });
};