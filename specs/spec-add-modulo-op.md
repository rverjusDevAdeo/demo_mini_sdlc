# Feature: add-modulo-op

## Description
Add a modulo operation to the calculator that computes the remainder when dividing one number by another. This completes the set of basic arithmetic operations (add, sub, mul, div, mod). The operation should handle edge cases such as division by zero with an appropriate error.

## Files to Modify
- `app.py` — add `mod(a, b)` function and register it in the `OPS` dict
- `test_app.py` — add tests for modulo operation (happy path and edge cases)

## Step by Step Tasks
1. Add `mod(a, b)` function in app.py that returns `a % b`
2. Add zero-divisor check in `mod` to raise `ValueError` when `b == 0`
3. Register `"mod"` in the `OPS` dict
4. Add `test_mod()` in test_app.py with a happy-path case (e.g. `mod(10, 3) == 1`)
5. Add `test_mod_by_zero_raises()` in test_app.py to verify the zero-divisor error
6. Run the Validation Commands below

## Validation Commands
- `uv run --with pytest pytest test_app.py -v`
- `python3 app.py mod 10 3` — verify the new op runs from the CLI
