/**
 * common-utils 模块导入转发
 * 转发第三方包和父级目录的导入
 * common-utils原则上应该只依赖第三方包而不依赖项目其它部分,包括common-utils中的其它内容
 * 如果对项目其它部分有依赖或者工具之间互相有依赖的,可能应该位于app-utils
 */
//@AITODDO校验通用工具的健康度,它不应该包含跟项目领域高度耦合的工具
// 第三方包
import VConsole from 'vconsole'
import { ref } from 'vue'

export { VConsole, ref }
