/**
 * 滚动相关类型守卫
 * 用于从 WheelEvent.currentTarget 获取 HTMLElement
 */

/**
 * 从 WheelEvent 获取当前目标元素
 * @param event 滚轮事件
 * @returns HTMLElement 或 null
 */
export const 获取滚动容器 = (event: WheelEvent): HTMLElement | null => {
    const target = event.currentTarget;
    if (target instanceof HTMLElement) {
        return target;
    }
    return null;
};
