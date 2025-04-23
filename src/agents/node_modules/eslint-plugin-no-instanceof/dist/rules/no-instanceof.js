"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noInstanceOfRule = void 0;
exports.noInstanceOfRule = {
    meta: {
        type: "suggestion",
        docs: {
            description: 'Disallows use of instance of to restrict logic based on prototype hierarchy',
            category: 'Best Practices',
            recommended: true,
            url: 'TBD'
        }
    },
    create: function (context) {
        return {
            BinaryExpression: function (node) {
                if (node.type === 'BinaryExpression' && node.operator === 'instanceof') {
                    context.report({
                        node: node,
                        message: 'Use of "instanceof" operator is forbidden'
                    });
                }
            }
        };
    }
};
