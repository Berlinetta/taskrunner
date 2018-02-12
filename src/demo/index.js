import demo1 from "./demos/Demo1";
import demo2 from "./demos/Demo2";
import demo3 from "./demos/Demo3";
import demo4 from "./demos/Demo4";
import demo5 from "./demos/Demo5";
import demo6 from "./demos/Demo6";

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