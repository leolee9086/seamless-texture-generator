import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import vueParser from 'vue-eslint-parser';
import vuePlugin from 'eslint-plugin-vue';
import {禁止静态方法规则} from './0_lints/messages.ts'
// ========================================================================
// 1. 定义规则片段
// ========================================================================

// [A] 基础架构约束
const BASE_ARCHITECTURE_RESTRICTIONS = [
  // ... (保持原有代码不变)
  禁止静态方法规则,
  {
    selector: 'PropertyDefinition[static=true]',
    message: '架构严令：禁止定义静态属性。常量请定义为模块级的 const。'
  },
  {
    selector: "FunctionDeclaration[params.length>3], ArrowFunctionExpression[params.length>3], FunctionExpression[params.length>3]",
    message: "函数参数不能超过3个。请使用对象参数模式 (Object Pattern)。\n或者使用合适的ctx类型。"
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
];

// [B] 类型纯洁性约束
const STRICT_TYPE_RESTRICTIONS = [
  // ... (保持原有代码不变)
  {
    selector: "TSAsExpression:not([typeAnnotation.type='TSTypeReference'][typeAnnotation.typeName.name='const']), TSTypeAssertion",
    message: "禁止使用 'as' 断言。请在 .guard.ts 中使用类型守卫，或依赖自动推断。"
  },
  {
    selector: 'TSTypeAliasDeclaration',
    message: '架构约束：禁止在业务/UI文件定义 Type。请移至 *.types.ts。'
  },
  {
    selector: 'TSInterfaceDeclaration',
    message: '架构约束：禁止在业务/UI文件定义 Interface。请移至 *.types.ts。'
  },
  {
    selector: 'TSEnumDeclaration',
    message: '架构约束：禁止在业务/UI文件定义 Enum。请移至 *.types.ts。'
  },
  {
    selector: 'TSTypePredicate',
    message: "架构约束：禁止在常规文件使用 'is' 关键字。类型守卫逻辑必须移至 *.guard.ts 文件中。"
  }
];

// [C] 孤岛导入约束
const STRICT_IMPORT_RESTRICTIONS = [
  // ... (保持原有代码不变)
  {
    selector: 'ImportDeclaration[source.value=/^\\.\\./]',
    message: '禁止从父级目录导入 (../)。必须通过 ./imports.ts 转发。'
  },
  {
    selector: 'ExportNamedDeclaration[source.value=/^\\.\\./]',
    message: '禁止从父级目录重导出 (../)。'
  },
  {
    selector: 'ExportAllDeclaration[source.value=/^\\.\\./]',
    message: '禁止从父级目录全量重导出 (../)。'
  },
  {
    selector: 'ImportDeclaration[source.value=/^[^.]/]',
    message: '禁止直接导入第三方包或别名。必须通过 ./imports.ts 转发。'
  },
  {
    selector: 'ExportNamedDeclaration[source.value=/^[^.]/]',
    message: '禁止直接重导出第三方包或别名。'
  },
  {
    selector: 'ExportAllDeclaration[source.value=/^[^.]/]',
    message: '禁止直接全量重导出第三方包或别名。'
  },
  {
    selector: 'ExportAllDeclaration',
    message: '禁止全量重导出 (export *)。仅允许在 index.ts 中使用。'
  },
  {
    selector: 'ExportNamedDeclaration[source]',
    message: '禁止重导出转发 (export { x } from ...)。仅允许在 index.ts 中使用。'
  }
];

// [D] 类定义约束
const STRICT_CLASS_RESTRICTIONS = [
  {
    selector: ':matches(ClassDeclaration, ClassExpression)',
    message: '架构严令：禁止在此文件中定义类 (Class)。类定义必须位于以 .class.ts 结尾的文件中。'
  }
];

// [E] 🔥🔥🔥 新增：禁止值导入约束 (只允许 import type) 🔥🔥🔥
const ONLY_ALLOW_TYPE_IMPORTS = [
  {
    // 复杂选择器解释：
    // 1. 选中所有 ImportDeclaration
    // 2. 过滤出 importKind 不为 'type' 的 (即值导入)
    // 3. 排除 (not) 来源路径以允许后缀结尾的导入
    selector: 'ImportDeclaration[importKind!="type"]:not([source.value=/(\.utils|\.guard|\.code|\.constants|\.ctx|\.imports|index)$/])',
    message: [
      '架构严令：禁止从业务文件进行“值导入” (Value Import)。',
      '------------------------------------------------',
      '❌ 违规行为: 你正在引入一个具体的业务实现 (Service, Class, Logic)。',
      '✅ 修正方案: 请使用 `import type` 引入接口，并通过参数传递上下文等方式获取它的实例，你需要恰当地调整代码结构以完成这个注入。',
      '------------------------------------------------',
      '💡例外情况: 允许直接导入纯工具与常量文件 (后缀: .utils, .guards, .constants, .ctx, imports, index)。'
    ].join('\n')
  }
];
// [F] 🔥🔥🔥 硬编码值约束 (除 constants.ts 外全域禁止) 🔥🔥🔥
const NO_MAGIC_STRINGS = [
  {
    // 选中：字符串字面量 ('str', "str") 和 模版字符串 (`str`)
    // 排除：
    // 1. Import/Export 的路径 source
    // 2. TS 类型定义中的字符串 (type T = 'A')
    // 3. 对象字面量的 Key ({ "key": val })
    // 4. JSX 属性 (className="flex" - 如需极致严格可移除此项)
    selector: [
      // 1. 选中目标：以单/双引号开头的字面量 (排除数字/布尔) 或 模版字符串
      ':matches(Literal[raw=/^["\']/], TemplateLiteral)',

      // 2. 排除上下文 (注意：这里保留了必要的空格，表示后代关系)
      ':not(ImportDeclaration Literal)',        // 排除 import 路径
      ':not(ExportNamedDeclaration Literal)',   // 排除 export { x } from 'path'
      ':not(ExportAllDeclaration Literal)',     // 排除 export * from 'path'
      ':not(TSLiteralType Literal)',            // 排除 TS 类型 (type T = 'A')
      ':not(Property > Literal.key)',           // 排除 对象属性 Key ({ "key": 1 })
      ':not(JSXAttribute Literal)',             // 排除 JSX 属性 (class="foo")
      ':not(TSEnumMember Literal)',             // 排除 枚举值 (enum A { B = 'C' })
      ':not(TSPropertySignature Literal)',      // 排除 接口属性 Key
      ':not(TSAsExpression Literal)',           // 排除 as 断言 (x as 'fixed')

      // 3. (可选) 常用放行 - 如果你希望允许 console.log 使用字符串，取消下面注释
      // ':not(CallExpression[callee.object.name="console"] Literal)',
      // ':not(NewExpression[callee.name="Error"] Literal)',
    ].join(''), // 直接连接字符串，不要 replace 空格
    message: `
架构严令：
禁止在逻辑中硬编码字符串 (Magic String)。
请将字符串提取到 *.constants.ts、*.code.ts等专用文件中，引用常量使用。
特殊的,wgsl代码等非js语言代码应该位于*.code.ts中。
    `
  }
];

// ========================================================================
// 1.5. PROMPTS 字典 (Linter-Agent Protocol)
// ========================================================================
const PROMPTS = {
  // [G] UI 组件架构模式
  VUE_TEMPLATE_TOO_LONG: {
    id: 'UI-001: Giant Template',
    mode: 'UI_COMPONENT_SPECIALIST', // 新角色：UI 组件专家
    reason: "检测到 Vue 组件模板部分超过 50 行。巨型模板难以维护且复用性差。",
    action: "请执行 '组件提取 (Extract Component)' 重构：\n1. 识别模板中的独立 UI 区块。\n2. 将其提取为子组件 (Sub-components)。\n3. 通过 props/events 通信。"
  },
  // 🔥🔥🔥 新增：Script 过长提示 🔥🔥🔥
  VUE_SCRIPT_TOO_LONG: {
    id: 'UI-002: Fat Script',
    mode: 'LOGIC_EXTRACTION_SPECIALIST', // 新角色：逻辑提取专家
    reason: "检测到 Vue 组件 Script 部分超过 50 行。UI 组件应只负责展示，不应包含复杂业务逻辑。",
    action: "请执行 '逻辑提取 (Extract Logic)' 重构：\n1. 将业务逻辑提取为 Composables (useXxx) 或纯工具函数。\n2. 将这些函数放入 *.utils.ts 或 *.ctx.ts 中。\n3. 在 Vue 中仅进行调用。"
  }
};

// 生成 Agent 指令的辅助函数
function generateAgentInstruction(prompt: typeof PROMPTS[keyof typeof PROMPTS]): string {
  return `
🤖 Linter-Agent Protocol 指令 🤖
----------------------------------------
ID: ${prompt.id}
模式: ${prompt.mode}
原因: ${prompt.reason}
行动: ${prompt.action}
----------------------------------------
请切换到 '${prompt.mode}' 模式执行上述重构。
  `.trim();
}

// ========================================================================
// 2. 本地规则插件 (Local Rules Plugin)
// ========================================================================
const localRulesPlugin = {
  rules: {
    // 规则 1: Vue 模板行数守卫
    'vue-template-max-lines': {
      meta: { type: 'problem' },
      create(context: any) {
        const MAX_LINES = 50;
        return {
          Program(node: any) {
            const templateBody = node.templateBody;
            if (!templateBody || !templateBody.loc) return;
            const lines = templateBody.loc.end.line - templateBody.loc.start.line;
            if (lines > MAX_LINES) {
              context.report({
                node: templateBody,
                message: generateAgentInstruction(PROMPTS.VUE_TEMPLATE_TOO_LONG)
              });
            }
          }
        };
      }
    },
    // 🔥🔥🔥 规则 3 (新增): Vue Script 行数守卫 🔥🔥🔥
    'vue-script-max-lines': {
      meta: { type: 'problem' },
      create(context: any) {
        const MAX_LINES = 50;
        return {
          Program(node: any) {
            // 获取 parser 服务
            const services = context.sourceCode?.parserServices || context.parserServices;
            // 获取 Vue 文件的根 DocumentFragment
            const df = services?.getDocumentFragment?.();

            if (df && df.children) {
              df.children.forEach((child: any) => {
                // 检查节点类型是否为 script 标签 (包括 script setup)
                if (child.type === 'VElement' && child.name === 'script') {
                   const lines = child.loc.end.line - child.loc.start.line;
                   if (lines > MAX_LINES) {
                     context.report({
                       node: child,
                       message: generateAgentInstruction(PROMPTS.VUE_SCRIPT_TOO_LONG)
                     });
                   }
                }
              });
            }
          }
        };
      }
    },
    // 规则 2: 禁止 Style 标签守卫
    'no-vue-style-block': {
      meta: { type: 'problem' },
      create(context: any) {
        return {
          Program(node: any) {
            const services = context.sourceCode?.parserServices || context.parserServices;
            const df = services?.getDocumentFragment?.();

            if (df && df.children) {
              df.children.forEach((child: any) => {
                if (child.type === 'VElement' && child.name === 'style') {
                  context.report({
                    node: child,
                    message: [
                      '架构严令：禁止在 Vue 组件中直接使用 <style> 代码块。',
                      '------------------------------------------------',
                      '❌ 违规行为: 定义了内部样式块。',
                      '✅ 修正方案: ',
                      '   1. 优先使用 Tailwind CSS / UnoCSS 等原子化类名。',
                      '   2. 如果必须写自定义 CSS，请建立独立的 css/scss 文件并导入。'
                    ].join('\n')
                  });
                }
              });
            }
          }
        };
      }
    }
  }
};

// ========================================================================
// 3. ESLint 配置主体
// ========================================================================

export default [
  // --- 忽略文件 ---
  {
    ignores: [
      '**/node_modules/**', '**/dist/**', '**/coverage/**', '**/*.js', '**/*.mjs',
      '**/toread/**', '**/benchmark/**', '**/experimental/**', '**/plans/**',
      '**/.claude/**', '**/.cursor/**', '**/.roo/**', '**/.trashed/**', '**/代码规约/**'
    ]
  },

  // --- 基础插件与解析器设置 ---
  {
    files: ['src/**/*.ts', 'src/**/*.tsx', 'test/**/*.ts', 'test/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        console: 'readonly', process: 'readonly', setTimeout: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'import': importPlugin,
    },
    rules: {
      // ... (保持基础规则不变)
      'no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'max-lines': ['error', { "max": 300, "skipBlankLines": true, "skipComments": true }],
      'max-lines-per-function': ['error', { "max": 50, "skipBlankLines": true, "skipComments": true, "IIFEs": true }],
      'class-methods-use-this': ['error', { "enforceForClassFields": true }],

      'no-restricted-syntax': [
        'error',
        ...BASE_ARCHITECTURE_RESTRICTIONS,
        ...STRICT_CLASS_RESTRICTIONS
      ]
    },
  },

  // ========================================================================
  // 3. 严格业务逻辑层 (Generic Core Logic)
  // ========================================================================
  // 作用于：除特殊后缀外的所有 .ts 文件
  // 约束：❌ 类定义, ❌ 值导入 (新增)
  {
    files: ['src/**/*.ts', 'src/**/*.tsx', 'test/**/*.ts', 'test/**/*.tsx'],
    ignores: [
      '**/imports.ts',
      '**/index.ts',
      '**/*.types.ts', '**/*.d.ts',
      '**/*.guard.ts',
      '**/*.test.ts', '**/*.spec.ts', '**/types.ts',
      '**/*.class.ts',
      // 🔥 排除允许值导入的文件
      '**/*.utils.ts',
      '**/*.ctx.ts',
      // 🔥 1. 忽略常量文件，交给下方专用块处理
      '**/*.constants.ts'
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...BASE_ARCHITECTURE_RESTRICTIONS,
        ...STRICT_TYPE_RESTRICTIONS,
        ...STRICT_IMPORT_RESTRICTIONS,
        ...STRICT_CLASS_RESTRICTIONS,
        ...ONLY_ALLOW_TYPE_IMPORTS, // <--- 强制只能导入类型
        // 🔥 2. 启用禁魔字符串
        ...NO_MAGIC_STRINGS
      ]
    }
  },

  // ========================================================================
  // 4. 网关层 (imports.ts) - 允许值导入
  // ========================================================================
  {
    files: ['src/**/imports.ts', 'test/**/imports.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...BASE_ARCHITECTURE_RESTRICTIONS,
        ...STRICT_TYPE_RESTRICTIONS,
        ...STRICT_CLASS_RESTRICTIONS,
        {
          selector: 'ImportDeclaration[source.value=/^\\.\\u002F/]',
          message: '架构约束：imports.ts 仅用于引入外部依赖。禁止导入同级或子级文件 (./)。同级文件不需要通过imports转发，直接导入即可'
        },
        // ... (保持原有规则)
        {
          selector: 'ExportNamedDeclaration[source.value=/^\\.\\u002F/]',
          message: '架构约束：imports.ts 仅用于引入外部依赖。禁止重导出同级或子级文件 (./)。同级文件不需要通过imports转发，直接导入即可'
        },
        {
          selector: 'ExportAllDeclaration[source.value=/^\\.\\u002F/]',
          message: '架构约束：imports.ts 禁止全量重导出内部文件 (./)。同级文件不需要通过imports转发，直接导入即可'
        }
      ]
    }
  },

  // ========================================================================
  // 5. 公共接口层 (index.ts) - 允许值导入
  // ========================================================================
  {
    files: ['src/**/index.ts', 'src/**/index.tsx', 'test/**/index.ts', 'test/**/index.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...BASE_ARCHITECTURE_RESTRICTIONS,
        ...STRICT_TYPE_RESTRICTIONS,
        ...STRICT_CLASS_RESTRICTIONS,
        ...STRICT_IMPORT_RESTRICTIONS.filter(r =>
          !r.selector.includes('ExportAllDeclaration') &&
          !r.selector.includes('ExportNamedDeclaration[source]')
        )
      ]
    }
  },

  // ========================================================================
  // 6. 类型定义层 (*.types.ts) - 仅类型
  // ========================================================================
  {
    files: ['src/**/*.types.ts', 'src/**/*.d.ts', 'src/**/types/**/*.ts', 'test/**/*.types.ts', 'test/**/*.d.ts', 'test/**/types/**/*.ts'],
    ignores: ['**/index.types.ts', '**/imports.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...BASE_ARCHITECTURE_RESTRICTIONS,
        ...STRICT_IMPORT_RESTRICTIONS,
        ...STRICT_CLASS_RESTRICTIONS,
        ...ONLY_ALLOW_TYPE_IMPORTS // <--- 既然是 types 文件，当然只能 import type
      ]
    }
  },

  // ========================================================================
  // 7. 类型守卫层 (*.guard.ts) - 允许值导入
  // ========================================================================
  {
    files: ['src/**/*.guard.ts', 'test/**/*.guard.ts'],
    rules: {
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',
      'no-restricted-syntax': [
        'error',
        ...BASE_ARCHITECTURE_RESTRICTIONS,
        ...STRICT_IMPORT_RESTRICTIONS,
        ...STRICT_CLASS_RESTRICTIONS,
        ...STRICT_TYPE_RESTRICTIONS.filter(r => !r.selector.includes('TSAsExpression') &&
          !r.selector.includes('TSTypePredicate')),
        ...NO_MAGIC_STRINGS // <--- 新增
      ]
    }
  },

  // ========================================================================
  // 8. 测试层 (*.test.ts) - 允许值导入
  // ========================================================================
  {
    files: ['test/**/*.test.ts', 'test/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/*.spec.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-restricted-syntax': [
        'error',
        ...BASE_ARCHITECTURE_RESTRICTIONS
      ]
    }
  },

  // ========================================================================
  // 9. 类定义文件 (*.class.ts) - 严格禁止值导入
  // ========================================================================
  // 约束：✅ 允许 Class, ❌ 禁止值导入 (必须依赖注入或纯计算)
  {
    files: ['src/**/*.class.ts', 'test/**/*.class.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...BASE_ARCHITECTURE_RESTRICTIONS,
        ...STRICT_TYPE_RESTRICTIONS,
        ...STRICT_IMPORT_RESTRICTIONS,
        ...ONLY_ALLOW_TYPE_IMPORTS, // <--- 🔥 关键：类文件中禁止引用运行时值
        ...NO_MAGIC_STRINGS // <--- 新增
      ]
    }
  },

  // ========================================================================
  // 10. 工具与上下文 (*.utils.ts, *.ctx.ts) - 允许值导入 (新增)
  // ========================================================================
  {
    files: ['src/**/*.utils.ts', 'src/**/*.ctx.ts', 'test/**/*.utils.ts', 'test/**/*.ctx.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...BASE_ARCHITECTURE_RESTRICTIONS,
        ...STRICT_TYPE_RESTRICTIONS, // 依然不建议在这里直接定义 interface
        ...STRICT_IMPORT_RESTRICTIONS,
        ...STRICT_CLASS_RESTRICTIONS,
        ...NO_MAGIC_STRINGS // <--- 新增
        // 禁止定义 Class
        // 允许值导入，所以不加 ONLY_ALLOW_TYPE_IMPORTS
      ]
    }
  },
  // ========================================================================
  // 11. 常量定义层 (*.constants.ts) - 字符串避难所
  // ========================================================================
  {
    files: ['src/**/*.constants.ts', 'test/**/*.constants.ts','src/**/*.code.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        // 依然遵守基础架构约束 (如禁止 switch, else 等)
        ...BASE_ARCHITECTURE_RESTRICTIONS,
        // 禁止 Class
        ...STRICT_CLASS_RESTRICTIONS,
        // 允许：字符串、数值等硬编码
      ]
    }
  },

  // ========================================================================
  // 12. Vue 组件层 (*.vue) - 新增
  // ========================================================================
  {
    files: ['src/**/*.vue'],
    languageOptions: {
      // 关键：外层解析器必须是 vue-eslint-parser
      parser: vueParser,
      parserOptions: {
        // 关键：内层解析器负责处理 TS
        parser: tsParser,
        // 移除 project 配置，因为 Vue 文件不需要 TypeScript 项目配置
        extraFileExtensions: ['.vue'],
        ecmaVersion: 2020,
        sourceType: 'module'
      }
    },
    plugins: {
      'vue': vuePlugin,           // 引入官方 vue 插件
      'local-guard': localRulesPlugin // 引入我们的影子规则插件
    },
    rules: {
      // 1. 基础 Vue 规则 (推荐开启 recommended)
      ...vuePlugin.configs['flat/recommended'].rules,
      
      // 2. 关闭官方的长度限制 (如果它有的话，避免冲突)
      // 'vue/max-lines-per-block': 'off',

      // 3. 🔥 开启我们的 "System Prompt" 影子规则
      'local-guard/vue-template-max-lines': 'error',
      'local-guard/vue-script-max-lines': 'error', // <--- 🔥 新增：Script 长度限制
      'local-guard/no-vue-style-block': 'error',

      // 4. 其他架构约束 (依然生效)
      'no-restricted-syntax': [
        'error',
        ...BASE_ARCHITECTURE_RESTRICTIONS,
        // 🔥🔥 新增：禁止在 Vue 中定义 Type/Interface/Enum 🔥🔥
        ...STRICT_TYPE_RESTRICTIONS,
        
        // Vue 文件中通常允许 import 值 (组件)，但可以加其他限制
        {
           selector: 'ImportDeclaration[source.value=/^\\.\\./]',
           message: '禁止从父级目录导入 (../)。必须通过 ./imports.ts 转发。'
       
        }
      ]
    }
  }

];