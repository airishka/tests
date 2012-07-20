go('a', function (a) {
    sQ.require(['b'], function (b) {
        doh.register(
            "theLoader/basic",
            [
                function theLoaderBasic(t) {
                    t.is('a', a.name);
                    t.is('b', b.name);
                }
            ]
        );
        doh.run();

    });

});