const Utility = require('./utilities');


test('anyValueBelowThreshold function', () => {
    expect(Utility.anyValueBelowThreshold([0.05, 0.99, 0.23], 0.03)).toBe(false);
    expect(Utility.anyValueBelowThreshold([0.05, 0.99, 0.23, 0.029], 0.03)).toBe(true);
    expect(Utility.anyValueBelowThreshold([], 0.03)).toBe(false);
    expect(Utility.anyValueBelowThreshold([0.5], 0.03)).toBe(false);
    expect(Utility.anyValueBelowThreshold([0.05, 0.03], 0.03)).toBe(false);
    expect(Utility.anyValueBelowThreshold([0.05, 0.03, 0.01], 0.03)).toBe(true);
});

// modification to typical median function
test('medianArrDict function', () => {
    let arr = [{ttoom: 100, a: 1}, {ttoom: 60, a: 3}, {ttoom: 120, a: 10}];
    expect(Utility.medianArrDict(arr, 'ttoom')['a']).toBe(1);
    arr.push({ttoom: 110, a: 4});
    expect(Utility.medianArrDict(arr, 'ttoom')['a']).toBe(1);
    arr.push({ttoom: 130, a: 5});
    expect(Utility.medianArrDict(arr, 'ttoom')['a']).toBe(4);
});

test('setSeed function', () => {
    // passing no seed creates random number
    let rng = Utility.setSeed();
    let rng2 = Utility.setSeed();
    expect(Math.abs(rng() - rng2())).toBeGreaterThan(1e-9);

    // passing no seed creates random number
    let rng3 = Utility.setSeed(28);
    let rng4 = Utility.setSeed(28);
    expect(Math.abs(rng3() - rng4())).toBeLessThan(1e-9);
    expect(Math.abs(rng3() - rng4())).toBeLessThan(1e-9);
    expect(Math.abs(rng3() - rng4())).toBeLessThan(1e-9);
    expect(Math.abs(rng3() - rng4())).toBeLessThan(1e-9);
});

    // // seeding rng if a seed is passed in (default is 0, which means user didnt pass in)
    // // otherwise just use random seed
    // setSeed(seed) {
    //     let rng;
    //     if (seed > 0) {
    //         rng = seedrandom(seed);
    //     } else {
    //         rng = seedrandom(Math.random());
    //     }
    //     return rng;
    // }
