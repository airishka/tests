define("funcThree", ["funcFour"], function (four) {
    var three = function (arg) {
        return arg + "-" + four.suffix();
    };

    three.suffix = function () {
        return "THREE_SUFFIX";
    };

    return three;
});
