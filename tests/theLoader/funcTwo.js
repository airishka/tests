define("funcTwo", ["funcOne"], function (func1) {
    var two = function (name) {
        this.name = name;
        this.one = new func1("ONE");
    };

    two.prototype.oneName = function () {
        return this.one.getName();
    };

    return two;
});
