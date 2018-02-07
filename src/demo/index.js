import demo1 from "./examples/Demo1";
import demo2 from "./examples/Demo2";
import demo3 from "./examples/Demo3";
import demo4 from "./examples/Demo4";
import demo5 from "./examples/Demo5";
import demo6 from "./examples/Demo6";

const demo = {
    demo1,
    demo2,
    demo3,
    demo4,
    demo5,
    demo6
};

export default function (n) {
    demo[`demo${n}`]();
}