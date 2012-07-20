define("one", ["two"], function(two) {
    exports.size = "large";
    exports.module = 'module - not implemented';
    exports.doSomething = function() {
        return two;
    };
    return exports;
});
