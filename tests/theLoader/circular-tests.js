go(["two"],//, "funcTwo", "funcThree"],
	function(two) {//,   funcTwo,   funcThree) {
        var args = two.doSomething(),
            twoInst = new funcTwo("TWO"),
            oneMod = two.getOneModule();

        doh.register(
            "theLoader/circular",
            [
                function theLoaderCircular(t) {
                    t.is("small", args.size);
                    t.is("redtwo", args.color);
                    //Check CommonJS "module.id" property support.
                   // t.is("one", oneMod.id);
                }
            ]
        );
        doh.run();

        doh.register(
            "theLoader/circularFunc",
            [
                function theLoaderCircularFunc(t) {
                    t.is("TWO", twoInst.name);
                    // t.is("ONE-NESTED", twoInst.oneName());
                    // t.is("THREE-THREE_SUFFIX", funcThree("THREE"));
                }
            ]
        );
        doh.run();
    }
);
