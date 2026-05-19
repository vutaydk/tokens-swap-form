1. Bugs:
- `lhsPriority` is undefined
- I think `balance.amount <= 0` is incorrect logic, it should keep position balance and ignore negative balance.
- Balance sorting logic is missing `leftPriority === rightPriority` case.

2. Inefficiencies
- `children` is destructured but never used
- `getPriority` is recreated on every render because it's defined inside the component body with no dependencies.
- `getPriority` is called twice per sort comparison.
- `formattedBalances` is computed but never used, it's redundant.
- `prices` is in dependencies of `sortedBalances` but it's never used. redundant

3. React anti-patterns
- use `index` as `key`
- `Props` extends `BoxProps` with an empty body
