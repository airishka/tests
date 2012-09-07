go(['one', 'two', 'three'], function (one, two, three) {

    var args = two.doSomething(),
        oneMod = two.getOneModule();

    doh.register(
        "funcString",
        [
            function funcString(t){
                t.is("large", one.size);
                t.is("small", two.size);
                t.is("small", args.size);
                t.is("redtwo", args.color);
                //Check CommonJS "module.id" property support.
                t.is("one", oneMod.id);
                t.is('three', three.name);
                t.is('four', three.fourName);
                t.is('five', three.fiveName);
            }
        ]
    );
    doh.run();

});


define('two', function(require) {
    //Dependencies
    var one = require('one');
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
/*
define('one', function(require, exports, module) {
    exports.size = "large";
    exports.module = module;
    exports.doSomething = function() {
        return require("two");
    };
});
*/
define('three', function (require, exports) {
    var four = require('four'),
        five = require('five');

    exports.name = 'three';
    exports.fourName = four;
    exports.fiveName = five();
});

define('four', function(){
    return 'four';
});

define('five', function(){
    return function () {
        return 'five';
    }
});