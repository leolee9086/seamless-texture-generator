import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import vueParser from 'vue-eslint-parser';
import vuePlugin from 'eslint-plugin-vue';
import { 禁止静态方法规则 } from './0_lints/messages.ts'

// ========================================================================
// 1. 定义规则片段
// ========================================================================

// [A] 基础架构约束 (所有 TS 文件通用)
const BASE_ARCHITECTURE_RESTRICTIONS = [
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

// [E] 禁止值导入约束
const ONLY_ALLOW_TYPE_IMPORTS = [
  {
    selector: 'ImportDeclaration[importKind!="type"]:not([source.value=/(\.utils|\.guard|\.code|\.constants|\.templates|\.prompts|\.ctx|\.imports|index)$/])',
    message: `
      架构严令：禁止从业务文件进行“值导入” (Value Import)。
      ------------------------------------------------
      ❌ 违规行为: 你正在引入一个具体的业务实现 (Service, Class, Logic)。
      修正方案1: 请使用 `import type` 引入接口，并通过参数传递上下文等方式获取它的实例。
      修正方案2: 如果这是一个较为通用的逻辑,使用.utils文件进行组合转发。
      修正方案3: 如果这是一个领域上下文逻辑,使用.ctx文件进行组合转发。
      修正方案4: 如果这是一个HTML模板字符串,使用.tempaltes进行转发,注意你可以导出函数以避免在普通文件中进行文本声明。
      修正方案5: 当且仅当，你认为这个值导入是绝对必要的，果你认为下方列出的例外后缀名中有合适的描述,可以重命名当前文件。
      修正方案6: 如果你认为,当前文件是其所在模块的出口,可以重命名为index.ts,以允许值导入.
      修正方案7: 将当前文件和相关文件归拢到一个合适的文件夹,并重命名为index.ts,以允许值导入.
      注意保证文件名对内容的精确描述
      ------------------------------------------------,
      💡例外情况: 允许直接导入纯工具与常量文件 (后缀: .utils, .guards, .constants, .templates, .prompts, .ctx, imports, index)。
    `
  }
];

// [F] 硬编码值约束
const NO_MAGIC_STRINGS = [
  {
    selector: [
      ':matches(Literal[raw=/^["\']/], TemplateLiteral)',
      ':not(ImportDeclaration Literal)',
      ':not(ExportNamedDeclaration Literal)',
      ':not(ExportAllDeclaration Literal)',
      ':not(TSLiteralType Literal)',
      ':not(Property > Literal.key)',
      ':not(JSXAttribute Literal)',
      ':not(TSEnumMember Literal)',
      ':not(TSPropertySignature Literal)',
      ':not(TSAsExpression Literal)',
    ].join(''),
    message: `
架构严令：
禁止在逻辑中硬编码字符串 (Magic String)。
请根据语义将字符串提取到专用文件：
1. *.constants.ts : 纯粹的常量值、配置项
2. *.code.ts      : 非JS代码片段 (如 WGSL, SQL, GLSL)
3. *.templates.ts : 文本模板、HTML片段
4. *.prompts.ts   : AI 提示词
    `
  }
];

// [H] 🔥🔥🔥 新增：动态导入与网络请求约束 (已修正) 
const RESTRICTION_NO_DYNAMIC_IMPORT = {
  // 变更点：增加 TSImportType 以捕获 type T = import('./x') 写法
  selector: ':matches(ImportExpression, TSImportType)', 
  message: [
    '架构严令：禁止使用内联导入或动态导入。',
    '1. 如果是类型引用 (import("...")), 请在文件头部使用 standard "import type" 语句。',
    '2. 如果是运行时懒加载 (await import("...")), 请将逻辑移至 *.loader.ts。'
  ].join('\n')
};
const RESTRICTION_NO_NETWORK = {
  selector: ':matches(CallExpression[callee.name="fetch"], CallExpression[callee.name="axios"], CallExpression[callee.object.name="axios"])',
  message: '架构严令：禁止直接发起网络请求 (fetch/axios)。数据获取逻辑请移至 *.api.ts 或 *.fetcher.ts。'
};

// [I] 组合约束：全局默认逻辑 (包含所有禁令)
// 大多数业务文件都应该遵守这个集合
const GLOBAL_LOGIC_RESTRICTIONS = [
  ...BASE_ARCHITECTURE_RESTRICTIONS,
  RESTRICTION_NO_DYNAMIC_IMPORT, // 默认禁止 import()
  RESTRICTION_NO_NETWORK         // 默认禁止 fetch
];

// ========================================================================
// 1.5. PROMPTS 字典
// ========================================================================
const PROMPTS = {
  VUE_TEMPLATE_TOO_LONG: {
    id: 'UI-001: Giant Template',
    mode: 'UI_COMPONENT_SPECIALIST',
    reason: "检测到 Vue 组件模板部分超过 50 行。",
    action: "请执行 '组件提取' 重构。"
  },
  VUE_SCRIPT_TOO_LONG: {
    id: 'UI-002: Fat Script',
    mode: 'LOGIC_EXTRACTION_SPECIALIST',
    reason: "检测到 Vue 组件 Script 部分超过 50 行。",
    action: "请执行 '逻辑提取' 重构，移入 .utils.ts 或 .ctx.ts。"
  }
};

function generateAgentInstruction(prompt: any): string {
  return `🤖 Agent指令: ${prompt.id} | ${prompt.mode}\n${prompt.reason}\n${prompt.action}`;
}

// ========================================================================
// 2. 本地规则插件
// ========================================================================
const localRulesPlugin = {
  rules: {
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
    'vue-script-max-lines': {
      meta: { type: 'problem' },
      create(context: any) {
        const MAX_LINES = 50;
        return {
          Program(node: any) {
            const services = context.sourceCode?.parserServices || context.parserServices;
            const df = services?.getDocumentFragment?.();
            if (df && df.children) {
              df.children.forEach((child: any) => {
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
                    message: '禁止使用 <style>。请使用 Tailwind CSS 或外部 CSS 文件。'
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

      // 默认应用全局约束
      'no-restricted-syntax': [
        'error',
        ...GLOBAL_LOGIC_RESTRICTIONS,
        ...STRICT_CLASS_RESTRICTIONS
      ]
    },
  },

  // ========================================================================
  // 3. 严格业务逻辑层 (Generic Core Logic)
  // ========================================================================
  {
    files: ['src/**/*.ts', 'src/**/*.tsx', 'test/**/*.ts', 'test/**/*.tsx'],
    ignores: [
      '**/imports.ts', '**/index.ts',
      '**/*.types.ts', '**/*.d.ts',
      '**/*.guard.ts',
      '**/*.test.ts', '**/*.spec.ts', '**/types.ts',
      '**/*.class.ts',
      '**/*.utils.ts', '**/*.ctx.ts',
      '**/*.constants.ts', '**/constants.ts',
      '**/*.templates.ts', '**/templates.ts',
      '**/*.prompts.ts', '**/prompts.ts',
      '**/*.code.ts',
      // 🔥 豁免特殊的加载和API文件，由专用层级处理
      '**/*.loader.ts',
      '**/*.api.ts',
      '**/*.fetcher.ts'
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...GLOBAL_LOGIC_RESTRICTIONS, // <-- 包含 Network/Import 禁令
        ...STRICT_TYPE_RESTRICTIONS,
        ...STRICT_IMPORT_RESTRICTIONS,
        ...STRICT_CLASS_RESTRICTIONS,
        ...ONLY_ALLOW_TYPE_IMPORTS,
        ...NO_MAGIC_STRINGS
      ]
    }
  },

  // ========================================================================
  // 4. 网关层 (imports.ts)
  // ========================================================================
  {
    files: ['src/**/imports.ts', 'test/**/imports.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...GLOBAL_LOGIC_RESTRICTIONS, // <-- 包含禁令
        ...STRICT_TYPE_RESTRICTIONS,
        ...STRICT_CLASS_RESTRICTIONS,
        {
          selector: 'ImportDeclaration[source.value=/^\\.\\u002F/]',
          message: '架构约束：imports.ts 仅用于引入外部依赖。'
        },
        {
          selector: 'ExportNamedDeclaration[source.value=/^\\.\\u002F/]',
          message: '架构约束：imports.ts 仅用于引入外部依赖。'
        },
        {
          selector: 'ExportAllDeclaration[source.value=/^\\.\\u002F/]',
          message: '架构约束：imports.ts 禁止全量重导出内部文件。'
        }
      ]
    }
  },

  // ========================================================================
  // 5. 公共接口层 (index.ts)
  // ========================================================================
  {
    files: ['src/**/index.ts', 'src/**/index.tsx', 'test/**/index.ts', 'test/**/index.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...GLOBAL_LOGIC_RESTRICTIONS,
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
  // 6. 类型定义层 (*.types.ts)
  // ========================================================================
  {
    files: ['src/**/*.types.ts', 'src/**/*.d.ts', 'src/**/types/**/*.ts', 'test/**/*.types.ts', 'test/**/*.d.ts', 'test/**/types/**/*.ts'],
    ignores: ['**/index.types.ts', '**/imports.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...GLOBAL_LOGIC_RESTRICTIONS,
        ...STRICT_IMPORT_RESTRICTIONS,
        ...STRICT_CLASS_RESTRICTIONS,
        ...ONLY_ALLOW_TYPE_IMPORTS
      ]
    }
  },

  // ========================================================================
  // 7. 类型守卫层 (*.guard.ts)
  // ========================================================================
  {
    files: ['src/**/*.guard.ts', 'test/**/*.guard.ts'],
    rules: {
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',
      'no-restricted-syntax': [
        'error',
        ...GLOBAL_LOGIC_RESTRICTIONS,
        ...STRICT_IMPORT_RESTRICTIONS,
        ...STRICT_CLASS_RESTRICTIONS,
        ...STRICT_TYPE_RESTRICTIONS.filter(r => !r.selector.includes('TSAsExpression') &&
          !r.selector.includes('TSTypePredicate')),
        ...NO_MAGIC_STRINGS
      ]
    }
  },

  // ========================================================================
  // 8. 测试层 (*.test.ts)
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
        // 测试文件通常可以允许 import() 和 fetch (如 mock)，暂不加严格限制
      ]
    }
  },

  // ========================================================================
  // 9. 类定义文件 (*.class.ts)
  // ========================================================================
  {
    files: ['src/**/*.class.ts', 'test/**/*.class.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...GLOBAL_LOGIC_RESTRICTIONS, // <-- 类中也禁止直接 Fetch 或 Import()
        ...STRICT_TYPE_RESTRICTIONS,
        ...STRICT_IMPORT_RESTRICTIONS,
        ...ONLY_ALLOW_TYPE_IMPORTS,
        ...NO_MAGIC_STRINGS
      ]
    }
  },

  // ========================================================================
  // 10. 工具与上下文 (*.utils.ts, *.ctx.ts)
  // ========================================================================
  {
    files: ['src/**/*.utils.ts', 'src/**/*.ctx.ts', 'test/**/*.utils.ts', 'test/**/*.ctx.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...GLOBAL_LOGIC_RESTRICTIONS, // <-- 工具函数也不应该直接发起请求，应依赖注入
        ...STRICT_TYPE_RESTRICTIONS,
        ...STRICT_IMPORT_RESTRICTIONS,
        ...STRICT_CLASS_RESTRICTIONS,
        ...NO_MAGIC_STRINGS
      ]
    }
  },

  // ========================================================================
  // 11. 常量与内容定义层
  // ========================================================================
  {
    files: [
      'src/**/*.constants.ts', 'test/**/*.constants.ts', 'src/**/*.code.ts', 'src/**/constants.ts',
      'src/**/*.templates.ts', 'test/**/*.templates.ts', 'src/**/templates.ts',
      'src/**/*.prompts.ts', 'test/**/*.prompts.ts', 'src/**/prompts.ts'
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...GLOBAL_LOGIC_RESTRICTIONS, // <-- 常量文件更不能有网络请求
        ...STRICT_CLASS_RESTRICTIONS,
      ]
    }
  },

  // ========================================================================
  // 12. Vue 组件层 (*.vue)
  // ========================================================================
  {
    files: ['src/**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.vue'],
        ecmaVersion: 2020,
        sourceType: 'module'
      }
    },
    plugins: {
      'vue': vuePlugin,
      'local-guard': localRulesPlugin
    },
    rules: {
      ...vuePlugin.configs['flat/recommended'].rules,
      'local-guard/vue-template-max-lines': 'error',
      'local-guard/vue-script-max-lines': 'error',
      'local-guard/no-vue-style-block': 'error',

      'no-restricted-syntax': [
        'error',
        ...GLOBAL_LOGIC_RESTRICTIONS, // <-- Vue 组件禁止直接 fetch 或 import()
        ...STRICT_TYPE_RESTRICTIONS,
        {
          selector: 'ImportDeclaration[source.value=/^\\.\\./]',
          message: '禁止从父级目录导入 (../)。必须通过 ./imports.ts 转发。'
        }
      ]
    }
  },

  // ========================================================================
  // 13. 🔥🔥🔥 数据加载层 (*.loader.ts) - 允许 Dynamic Import 🔥🔥🔥
  // ========================================================================
  {
    files: ['src/**/*.loader.ts', 'test/**/*.loader.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...BASE_ARCHITECTURE_RESTRICTIONS, // 基础约束
        ...STRICT_TYPE_RESTRICTIONS,
        ...STRICT_CLASS_RESTRICTIONS,
        ...NO_MAGIC_STRINGS,
        
        // 关键：这里只包含 "禁止网络" 规则，【不】包含 "禁止动态导入" 规则
        RESTRICTION_NO_NETWORK 
      ]
    }
  },

  // ========================================================================
  // 14. 🔥🔥🔥 网络请求层 (*.api.ts, *.fetcher.ts) - 允许 Fetch/Axios 🔥🔥🔥
  // ========================================================================
  {
    files: ['src/**/*.api.ts', 'src/**/*.fetcher.ts', 'test/**/*.api.ts', 'test/**/*.fetcher.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...BASE_ARCHITECTURE_RESTRICTIONS, // 基础约束
        ...STRICT_TYPE_RESTRICTIONS,
        ...STRICT_CLASS_RESTRICTIONS,
        ...NO_MAGIC_STRINGS,

        // 关键：这里只包含 "禁止动态导入" 规则，【不】包含 "禁止网络" 规则
        RESTRICTION_NO_DYNAMIC_IMPORT
      ]
    }
  }

];