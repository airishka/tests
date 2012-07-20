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
    }
);
