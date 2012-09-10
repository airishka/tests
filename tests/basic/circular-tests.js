go(    ["require", "two"], // "funcTwo", "funcThree"],
function(require,   two,   funcTwo,   funcThree) {
        var args = two.doSomething(),
            // twoInst = new funcTwo("TWO"),
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
/*
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
        */
    }
);



define("one", ["require", "exports", "module", "two"], function(require, exports, module) {
    exports.size = "large";
    exports.module = module;
    exports.doSomething = function() {
        return require("two");
    };
});


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