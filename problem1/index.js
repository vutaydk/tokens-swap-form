// Assumptions:
// input will always produce a result lesser than `Number.MAX_SAFE_INTEGER`*.
// `n` is a positive integer, the function should return the summation of all integers from `1` to `n`.
// For example, if `n` is `5`, the function should return `15` because `1 + 2 + 3 + 4 + 5 = 15`.

// **Input**: `n` - any integer
// **Output**: `return` - summation to `n`, i.e. `sum_to_n(5) === 1 + 2 + 3 + 4 + 5 === 15`.


var sum_to_n_a = function(n) {
    // Use a simple loop to calculate the sum of first n natural numbers
    if (n <= 0) return 0;
    let sum = 0;
    for (let i = 1; i <= n; i++) {
        sum += i;
    }
    return sum;
};

var sum_to_n_b = function(n) {
    // Use mathematical formula for sum of first n natural numbers: n(n + 1) / 2
    if (n <= 0) return 0;
    return (n * (n + 1)) / 2;
};

var sum_to_n_c = function(n) {
    // Use recursion to calculate the sum of first n natural numbers
    if (n <= 0) return 0;
    if (n === 1) return 1;
    return n + sum_to_n_c(n - 1);
};

// Test cases
const testData = [
    { input: 5, expected: 15 },
    { input: 10, expected: 55 },
    { input: 1, expected: 1 },
    { input: 100, expected: 5050 },
    { input: 0, expected: 0 }, // Edge case: sum to 0 should be 0
    { input: -5, expected: 0 } // Edge case: sum to negative number should be 0
]
for (const { input, expected } of testData) {
    console.log(`Testing sum_to_n_a(${input}) === ${expected}:`, sum_to_n_a(input) === expected);
    console.log(`Testing sum_to_n_b(${input}) === ${expected}:`, sum_to_n_b(input) === expected);
    console.log(`Testing sum_to_n_c(${input}) === ${expected}:`, sum_to_n_c(input) === expected);
}