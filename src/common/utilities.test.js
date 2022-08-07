const Utility = require('./utilities');


test('anyValueBelowThreshold function', () => {
    expect(Utility.anyValueBelowThreshold([0.05, 0.99, 0.23], 0.03)).toBe(false);
    expect(Utility.anyValueBelowThreshold([0.05, 0.99, 0.23, 0.029], 0.03)).toBe(true);
    expect(Utility.anyValueBelowThreshold([], 0.03)).toBe(false);
    expect(Utility.anyValueBelowThreshold([0.5], 0.03)).toBe(false);
    expect(Utility.anyValueBelowThreshold([0.05, 0.03], 0.03)).toBe(false);
    expect(Utility.anyValueBelowThreshold([0.05, 0.03, 0.01], 0.03)).toBe(true);
});


