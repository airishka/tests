define("two", ["require", "one"], function(require, one) {
    return {
        size: "small",
        color: "redtwo",
        doSomething: function() {
            return one.doSomething();
        },
        getOneModule: function() {
            return one.module;
        }
    };
});

define("one", ["require", "exports", "module", "two"], function(require, exports, module) {
    exports.size = "large";
    exports.module = module;
    exports.doSomething = function() {
        return require("two");
    };
});

define("funcOne", ["require", "funcTwo"], function (require) {
    var one = function (name) {
        this.name = name;
    };

    one.prototype.getName = function () {
        var inst = new (require("funcTwo"))("-NESTED");
        return this.name + inst.name;
    };

    return one;
});

define("funcTwo", ["require", "funcOne"], function (require) {
    var two = function (name) {
        this.name = name;
        this.one = new (require("funcOne"))("ONE");
    };

    two.prototype.oneName = function () {
        return this.one.getName();
    };

    return two;
});

define("funcFour", ["require", "funcThree"], function (require) {
    var four = function (arg) {
        return "FOUR called with " + arg;
    };

    four.suffix = function () {
        return require("funcThree").suffix();
    };

    return four;
});

define("funcThree", ["require", "funcFour"], function (require, four) {
    var three = function (arg) {
        return arg + "-" + require("funcFour").suffix();
    };

    three.suffix = function () {
        return "THREE_SUFFIX";
    };

    return three;
});

////////////////////////////////////////////////////////////////////////////////

go(["require", "two", "funcTwo", "funcThree"], //
function(require, two, funcTwo,   funcThree) {//
        var args = two.doSomething(),
            twoInst = new funcTwo("TWO"),
            oneMod = two.getOneModule();

        doh.register(
            "circular",
            [
                function circular(t) {
                    t.is("small", args.size);
                    t.is("redtwo", args.color);
                    //Check CommonJS "module.id" property support.
                    t.is("one", oneMod.id);
                }
            ]
        );
        doh.run();

        doh.register(
            "circularFunc",
            [
                function circularFunc(t) {
                    t.is("TWO", twoInst.name);
                    t.is("ONE-NESTED", twoInst.oneName());
                    t.is("THREE-THREE_SUFFIX", funcThree("THREE"));
                }
            ]
        );
        doh.run();
        
    }
);