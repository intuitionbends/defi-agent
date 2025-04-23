"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var eslint_1 = require("eslint");
var no_instanceof_1 = require("./no-instanceof");
var tester = new eslint_1.RuleTester({ parserOptions: { ecmaVersion: 2015 } });
tester.run("no-literal", no_instanceof_1.noInstanceOfRule, {
    valid: [{ code: "let x" }],
    invalid: [
        {
            code: "const y = x instanceof Boolean",
            errors: [{ message: 'Use of "instanceof" operator is forbidden' }],
        },
    ],
});
