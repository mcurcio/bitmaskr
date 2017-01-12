'use strict';

class RadixNumber {
    constructor(number, radix) {
        this.number = number;
        this.radix = radix;
    }
};

class Parser {
    constructor() {}

    parse(str) {
        // special case bail
        if (str.trim().length === 0) {
            return [];
        }

        let expression = [];
        let tokens = this._tokenize(str);

        console.log("tokens", tokens);

        // an expression is basically [number, op, number, op], so this bit
        // tracks whether we are expecting an op or a number
        let opExpected = false;

        for (let i = 0; i < tokens.length; ++i) {
            let token = tokens[i].trim();

            if (opExpected) {
                if (token === "&" || token === "|") {
                    expression.push(token);
                } else {
                    throw new Error("Expected operator");
                }
            } else {
                // assume its a good number, until we find out its not

                // radix magic here!
                if (token.startsWith("0x")) {
                    // test its a good hex number
                    let num = token.substring(2);
                    let good = /^[0-9a-f]+$/.test(num);
                    if (!good) {
                        throw new Error("Invalid hex number", token);
                    }

                    expression.push(new RadixNumber(parseInt(num, 16), 16));
                } else if (token.endsWith("b")) {
                    // it looks like a boolean!

                    let num = token.substring(0, token.length-1);
                    let good = /^[01]+$/.test(num);
                    if (!good) {
                        throw new Error("Invalid boolean number: " + num);
                    }

                    expression.push(new RadixNumber(parseInt(num, 2), 2));
                } else {
                    // else its a base 10

                    let good = /^[0-9]+$/.test(token);
                    if (!good) {
                        throw new Error("Invalid decimal number", token);
                    }

                    expression.push(new RadixNumber(parseInt(token, 10), 10));
                }

            }

            opExpected = !opExpected;
        }

        return expression;
    }

    _tokenize(str) {
        // split string on special characters (and, or)
        return str.split(/([&|]+)/);
    }
};

class Solver {
    constructor(equation) {
        this._input = equation;
        this._parser = new Parser;
        this._expression = this._parser.parse(equation);

        this._solve();
    }

    _solve() {
        this.solution = 0;
        this.base = 10; // default to base 10 for now

        let baseCounter = {
            2: 0,
            10: 0,
            16: 0
        };

        // default to 10, but then overwrite with the first element in the expression
        let base = 10;
        let count = 1;

        // invalid expression if there are less than two elements, since [num, op, num] is needed
        if (this._expression.length > 2) {
            let expressions = this._expression.slice();

            let start = expressions.shift();
            if (start instanceof RadixNumber) {
                this.solution = start.number;
                baseCounter[start.radix]++;
                base = start.radix;
            } else {
                throw new Error("First element in expression must be a number");
            }

            console.log("start", this.solution);

            while (expressions.length > 0) {
                if (expressions.length === 1) {
                    throw new Error("Expression ended prematurely; expected operator and number");
                }

                let op = expressions.shift();
                if (!(op === "&" || op === "|")) {
                    throw new Error("Unexpected operator");
                }

                let next = expressions.shift();
                if (!(next instanceof RadixNumber)) {
                    throw new Error("Unexpected number");
                }
                baseCounter[next.radix]++;

                if (op === "&") {
                    this.solution &= next.number;
                } else if (op === "|") {
                    this.solution |= next.number;
                }

                console.log("solution", this.solution, baseCounter);
            }
        }

        // calculate the "automatic" radix -- the one used most, or the first
        console.log("count", baseCounter);
        for (let key in baseCounter) {
            console.log("key", key);
            let value = baseCounter[key];
            console.log("value", value);
            if (value > count) {
                base = key;
                count = value;
            }
        }

        console.log("computed", base);
        this.base = base;
    }
};
