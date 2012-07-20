(go.config(true))('a', function (a) {
    (sQ.require.config(true))(['b'], function (b) {
        doh.register(
            "theLoader/basic",
            [
                function theLoaderBasic(t) {
                    t.is('a', a.name);
                    t.is('b', b.name);
					t.is('c', b.c.name);
                }
            ]
        );
        doh.run();

    });

});