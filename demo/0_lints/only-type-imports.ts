/**
 * 禁止值导入约束
 * 
 * 要求业务文件只能使用 import type，值导入必须从特定后缀文件获取
 */
export const ONLY_ALLOW_TYPE_IMPORTS = [
    {
        selector: 'ImportDeclaration[importKind!="type"]:not([source.value=/(\\.utils|\\.guard|\\.code|\\.constants|\\.templates|\\.prompts|\\.ctx|\\.imports|index)$/])',
        message: `
      架构严令：禁止从业务文件进行"值导入" (Value Import)。
      ------------------------------------------------
      ❌ 违规行为: 你正在引入一个具体的业务实现 (Service, Class, Logic)。
      修正方案1: 请使用 import type 引入接口，并通过参数传递上下文等方式获取它的实例。
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
