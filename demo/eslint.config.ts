import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import vueParser from 'vue-eslint-parser';
import vuePlugin from 'eslint-plugin-vue';

// ========================================================================
// 导入拆分后的规则定义
// ========================================================================
import {
  BASE_ARCHITECTURE_RESTRICTIONS,
  STRICT_TYPE_RESTRICTIONS,
  STRICT_IMPORT_RESTRICTIONS,
  STRICT_CLASS_RESTRICTIONS,
  ONLY_ALLOW_TYPE_IMPORTS,
  NO_MAGIC_STRINGS,
  RESTRICTION_NO_DYNAMIC_IMPORT,
  RESTRICTION_NO_NETWORK,
  GLOBAL_LOGIC_RESTRICTIONS,
  NO_SINGLE_CHAR_VAR_RESTRICTIONS,
  ID_LENGTH_RULE_CONFIG
} from './0_lints/combined-restrictions.ts'

import { localRulesPlugin } from './0_lints/vue-custom-rules.ts'
import { aiWorkerPlugin } from './0_lints/ai-worker-rules.ts' // 导入 AI Worker 插件
import { 接口职责分离插件 } from './0_lints/interface-responsibility.ts'
import { functionMinLinesPlugin } from './0_lints/function-min-lines.ts' // 导入函数最小行数检查插件

// ========================================================================
// 3. ESLint 配置主体
// ========================================================================

export default [
  // --- 忽略文件 ---
  {
    ignores: [
      '**/node_modules/**', '**/dist/**', '**/coverage/**', '**/*.js', '**/*.mjs',
      '**/toread/**', '**/benchmark/**', '**/experimental/**', '**/plans/**',
      '**/.claude/**', '**/.cursor/**', '**/.roo/**', '**/.trashed/**', '**/代码规约/**',
      '**/0_lints/**'  // lint 规则定义文件本身不需要被扫描
    ]
  },

  // ========================================================================
  // 2. AI Worker 协议 (全局应用)
  // ========================================================================
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.vue', '**/*.d.ts'],
    plugins: {
      'ai-worker': aiWorkerPlugin,
      'function-min-lines': functionMinLinesPlugin
    },
    rules: {
      'ai-worker/detect-ai-todo': 'error',
      'function-min-lines/function-min-lines': 'error'
    }
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
      // 禁止单字母变量名 (内置规则)
      'id-length': ID_LENGTH_RULE_CONFIG,

      // 默认应用全局约束
      'no-restricted-syntax': [
        'error',
        ...GLOBAL_LOGIC_RESTRICTIONS,
        ...STRICT_CLASS_RESTRICTIONS,
        ...NO_SINGLE_CHAR_VAR_RESTRICTIONS
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
      '**/*.schema.ts',
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
        ...NO_MAGIC_STRINGS,
        ...NO_SINGLE_CHAR_VAR_RESTRICTIONS
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
        ...STRICT_IMPORT_RESTRICTIONS
        // 注意：不再对 export ... from 语法进行豁免，所有文件都必须先 import 再 export
      ]
    }
  },

  // ========================================================================
  // 6. 类型定义层 (*.types.ts)
  // ========================================================================
  {
    files: ['src/**/*.types.ts', 'src/**/*.d.ts', 'src/**/types/**/*.ts', 'test/**/*.types.ts', 'test/**/*.d.ts', 'test/**/types/**/*.ts'],
    ignores: ['**/index.types.ts', '**/imports.ts', '**/index.ts'],
    plugins: {
      'interface-guard': 接口职责分离插件
    },
    rules: {
      'interface-guard/接口职责分离': 'error',
      'interface-guard/禁止单属性接口': 'error',
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
        ...NO_MAGIC_STRINGS,
        ...NO_SINGLE_CHAR_VAR_RESTRICTIONS
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
        ...NO_MAGIC_STRINGS,
        ...NO_SINGLE_CHAR_VAR_RESTRICTIONS
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
        ...NO_MAGIC_STRINGS,
        ...NO_SINGLE_CHAR_VAR_RESTRICTIONS
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
        ...NO_SINGLE_CHAR_VAR_RESTRICTIONS
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
          selector: 'ImportDeclaration[source.value=/^\\u002E\\u002E\\u002F/]',
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
        ...NO_SINGLE_CHAR_VAR_RESTRICTIONS,

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
        ...NO_SINGLE_CHAR_VAR_RESTRICTIONS,

        // 关键：这里只包含 "禁止动态导入" 规则，【不】包含 "禁止网络" 规则
        RESTRICTION_NO_DYNAMIC_IMPORT
      ]
    }
  },

  // ========================================================================
  // 15. 🔥🔥🔥 Schema 定义层 (*.schema.ts) - 允许 Zod 导入和类型声明 🔥🔥🔥
  // ========================================================================
  {
    files: ['src/**/*.schema.ts', 'test/**/*.schema.ts'],
    ignores: ['**/index.schema.ts', '**/imports.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...GLOBAL_LOGIC_RESTRICTIONS,
        ...STRICT_IMPORT_RESTRICTIONS,
        ...STRICT_CLASS_RESTRICTIONS,
        // 注意：这里不包含 ONLY_ALLOW_TYPE_IMPORTS，允许 zod 的值导入
        ...NO_MAGIC_STRINGS,
        ...NO_SINGLE_CHAR_VAR_RESTRICTIONS
      ]
    }
  }

];