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
    expect(Utility.medianArrDict(arr, 'ttoom')['a']).toBe(10);
});

