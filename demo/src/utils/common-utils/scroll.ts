import { 获取滚动容器 } from './scroll.guard';

/**
 * 优先处理水平滚动，到达边界后尝试垂直滚动
 */
export function horizontalScrollFirst(event: WheelEvent): void {
    const container = 获取滚动容器(event);
    if (!container) {
        return;
    }

    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    const newScrollLeft = container.scrollLeft + event.deltaX;

    // 卫语句：正常滚动范围内
    if (newScrollLeft > 0 && newScrollLeft < maxScrollLeft) {
        event.preventDefault();
        event.stopPropagation();
        container.scrollLeft = newScrollLeft;
        return;
    }

    // 卫语句：在边界但方向不是继续越界
    const 到达左边界向右滚 = newScrollLeft <= 0 && event.deltaX >= 0;
    const 到达右边界向左滚 = newScrollLeft >= maxScrollLeft && event.deltaX <= 0;
    if (到达左边界向右滚 || 到达右边界向左滚) {
        event.preventDefault();
        event.stopPropagation();
        container.scrollLeft = newScrollLeft;
        return;
    }

    // 到达边界且继续越界方向 - 限制边界并尝试垂直滚动
    container.scrollLeft = newScrollLeft <= 0 ? 0 : maxScrollLeft;
    verticalScroll(event);
}

/**
 * 优先处理垂直滚动，到达边界后尝试水平滚动
 */
export function verticalScrollFirst(event: WheelEvent): void {
    const container = 获取滚动容器(event);
    if (!container) {
        return;
    }

    const maxScrollTop = container.scrollHeight - container.clientHeight;
    const newScrollTop = container.scrollTop + event.deltaY;

    // 卫语句：正常滚动范围内
    if (newScrollTop > 0 && newScrollTop < maxScrollTop) {
        event.preventDefault();
        container.scrollTop = newScrollTop;
        return;
    }

    // 卫语句：在边界但方向不是继续越界
    const 到达顶部向下滚 = newScrollTop <= 0 && event.deltaY >= 0;
    const 到达底部向上滚 = newScrollTop >= maxScrollTop && event.deltaY <= 0;
    if (到达顶部向下滚 || 到达底部向上滚) {
        event.preventDefault();
        container.scrollTop = newScrollTop;
        return;
    }

    // 到达边界且继续越界方向 - 限制边界并尝试水平滚动
    container.scrollTop = newScrollTop <= 0 ? 0 : maxScrollTop;
    horizontalScroll(event);
}

/**
 * 处理垂直滚动（水平+垂直增量合并）
 */
export function verticalScroll(event: WheelEvent): void {
    const container = 获取滚动容器(event);
    if (!container) {
        return;
    }

    const maxScrollTop = container.scrollHeight - container.clientHeight;
    const newScrollTop = container.scrollTop + event.deltaY + event.deltaX;

    // 卫语句：正常滚动范围内
    if (newScrollTop > 0 && newScrollTop < maxScrollTop) {
        event.preventDefault();
        container.scrollTop = newScrollTop;
        return;
    }

    // 卫语句：在边界但方向不是继续越界
    const 向上滚动 = event.deltaY < 0;
    const 在顶部向下滚或不动 = newScrollTop <= 0 && !向上滚动;
    const 在底部向上滚或不动 = newScrollTop >= maxScrollTop && 向上滚动;
    if (在顶部向下滚或不动) {
        event.preventDefault();
        container.scrollTop = newScrollTop;
        return;
    }
    if (在底部向上滚或不动) {
        event.preventDefault();
        container.scrollTop = newScrollTop;
        return;
    }

    // 到达边界且继续越界 - 仅限制边界，不阻止默认行为
    container.scrollTop = newScrollTop <= 0 ? 0 : maxScrollTop;
}

/**
 * 处理水平滚动（水平+垂直增量合并）
 */
export function horizontalScroll(event: WheelEvent): void {
    const container = 获取滚动容器(event);
    if (!container) {
        return;
    }

    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    const delta = event.deltaY + event.deltaX;
    const newScrollLeft = container.scrollLeft + delta;

    // 卫语句：正常滚动范围内
    if (newScrollLeft > 0 && newScrollLeft < maxScrollLeft) {
        event.preventDefault();
        container.scrollLeft = newScrollLeft;
        return;
    }

    // 卫语句：在边界但方向不是继续越界
    const 向左滚动 = delta < 0;
    const 在左边界向右滚或不动 = newScrollLeft <= 0 && !向左滚动;
    const 在右边界向左滚或不动 = newScrollLeft >= maxScrollLeft && 向左滚动;
    if (在左边界向右滚或不动) {
        event.preventDefault();
        container.scrollLeft = newScrollLeft;
        return;
    }
    if (在右边界向左滚或不动) {
        event.preventDefault();
        container.scrollLeft = newScrollLeft;
        return;
    }

    // 到达边界且继续越界 - 仅限制边界，不阻止默认行为
    container.scrollLeft = newScrollLeft <= 0 ? 0 : maxScrollLeft;
}
