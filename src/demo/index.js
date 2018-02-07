import demo1 from "./examples/Demo1";
import demo2 from "./examples/Demo2";
import demo3 from "./examples/Demo3";
import demo4 from "./examples/Demo4";

const demo = {
    demo1,
    demo2,
    demo3,
    demo4
};

export default function (n) {
    demo[`demo${n}`]();
}