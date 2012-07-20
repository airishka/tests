define("funcOne", ["funcTwo"], function (funcTwo) {
    var one = function (name) {
        this.name = name;
    };

    one.prototype.getName = function () {
        var inst = new funcTwo("-NESTED");
        return this.name + inst.name;
    };

    return one;
});
