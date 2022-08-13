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

test('medianStatistics function', () => {
    let data = [
          [{ source: 'Libram', MP5: 299 }, { source: 'Illumination', MP5: 551 },],
          [{ source: 'Libram', MP5: 298 }, { source: 'Illumination', MP5: 483 },],
          [{ source: 'Libram', MP5: 300 },{ source: 'Illumination', MP5: 403 },]
        ];

    let results = Utility.medianStatistics(data, 'source', 'MP5');
    console.log(results);
    expect(results[0]['source']).toBe('Illumination');
    expect(results[1]['source']).toBe('Libram');
    expect(results[0]['MP5']).toBe(483);
    expect(results[1]['MP5']).toBe(299);
});

