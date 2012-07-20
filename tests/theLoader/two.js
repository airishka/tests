define("two", ["one"], function(one) {
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
