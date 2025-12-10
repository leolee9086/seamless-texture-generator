import type { VueComponent, ComponentIo } from "./types";
import { hasName, hasProps, hasEmits } from "./core.guard";

export const getComponentIo = (component: VueComponent): ComponentIo => {
    // 使用类型守卫而不是类型断言来安全地获取组件属性
    const name = hasName(component) ? component.name : undefined;
    const props = hasProps(component) ? component.props : undefined;
    const emits = hasEmits(component) ? component.emits : undefined;
    
    return {
        name, props, emits
    }
}