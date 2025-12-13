import { 禁止静态方法规则 } from './messages.ts'

/**
 * 基础架构约束 (所有 TS 文件通用)
 * 
 * 包括:
 * - 禁止静态方法和静态属性
 * - 函数参数数量限制
 * - 禁止 forEach
 * - 禁止 else 和嵌套 if
 * - 禁止 switch
 * - 禁止 export ... from 语法
 */
export const BASE_ARCHITECTURE_RESTRICTIONS = [
    禁止静态方法规则,
    {
        selector: 'PropertyDefinition[static=true]',
        message: '架构严令：禁止定义静态属性。常量请定义为模块级的 const。'
    },
    {
        selector: "FunctionDeclaration[params.length>3], ArrowFunctionExpression[params.length>3], FunctionExpression[params.length>3]",
        message: `
        函数参数不能超过3个。请使用对象参数模式 (Object Pattern)。
        或者使用合适的ctx类型。
        请注意ctx类型
        `
    },
    {
        selector: 'CallExpression[callee.property.name="forEach"]',
        message: [
            '❌ 禁止使用 .forEach()。',
            '原因 1: forEach 无法等待异步操作。',
            '原因 2: forEach 无法提前中断。',
            '替代方案: for...of / .map() / .filter()'
        ].join('\n'),
    },
    {
        selector: 'IfStatement[alternate]',
        message: '❌ 禁止使用 else。请使用 "卫语句 (Guard Clauses)" 扁平化逻辑。',
    },
    {
        selector: 'IfStatement > BlockStatement > IfStatement',
        message: '❌ 禁止嵌套 If。请合并判断条件 (&&) 或提取函数。',
    },
    {
        selector: 'IfStatement > IfStatement',
        message: '❌ 禁止嵌套 If。请合并逻辑。',
    },
    {
        selector: 'SwitchStatement',
        message: [
            '❌ 禁止使用 switch 语句。',
            '替代方案: Object Literal / Map / Strategy Pattern / Polymorphism'
        ].join('\n'),
    },
    {
        selector: 'ExportNamedDeclaration[source]',
        message: [
            '❌ 禁止直接使用 export { ... } from "..." 语法。',
            '原因: 导出转发会降低代码可追溯性。',
            '要求: 必须先 import，然后再 export。',
            '示例:',
            '  // ❌ 错误',
            '  export { foo } from "./bar"',
            '  // ✅ 正确',
            '  import { foo } from "./bar"',
            '  export { foo }'
        ].join('\n'),
    },
    {
        selector: 'ExportAllDeclaration',
        message: [
            '❌ 禁止直接使用 export * from "..." 语法。',
            '原因: 全量导出转发会严重降低代码可追溯性和可维护性。',
            '要求: 必须先 import，然后再 export。',
            '示例:',
            '  // ❌ 错误',
            '  export * from "./utils"',
            '  // ✅ 正确',
            '  import * as utils from "./utils"',
            '  export { utils }'
        ].join('\n'),
    },
];
