import {A, B, C, D, E, H, J, L, M, O} from "../DemoClasses";
import TaskRunner from "../../TaskRunner/TaskRunner";

export default () => {
    const TR = new TaskRunner();

    const AI = new A("AA", {info: "this is param"});
    const BI = new B("BB", null, true);
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
};