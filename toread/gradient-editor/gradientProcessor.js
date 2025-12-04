import { 相对线计算点的垂点 } from "./geometryProcessor.js";

// 获取元素的屏幕空间边界
export const 获取元素边界 = (元素) => {
    let rect = 元素.getBoundingClientRect();
    return {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
    };
}
// 计算渐变线的长度
export const 计算渐变线长度 = (渐变框边界, 渐变角度) => {
    let angle = 渐变角度 * Math.PI / 180; // 将角度转换为弧度
    return Math.abs(渐变框边界.width * Math.sin(angle)) +
        Math.abs(渐变框边界.height * Math.cos(angle));
}

// 计算中心点
export const 计算中心点 = (渐变框边界) => {
    return {
        x: 渐变框边界.x + 渐变框边界.width / 2,
        y: 渐变框边界.y + 渐变框边界.height / 2
    };
}

// 计算起点和终点
export const 计算起点和终点 = (中心点, 渐变线长度, 渐变角度) => {
    let angle = 渐变角度 * Math.PI / 180; // 将角度转换为弧度
    let yDiff = Math.sin(angle - Math.PI / 2) * 渐变线长度 / 2;
    let xDiff = Math.cos(angle - Math.PI / 2) * 渐变线长度 / 2;
    return {
        start: {
            x: 中心点.x - xDiff,
            y: 中心点.y - yDiff
        },
        end: {
            x: 中心点.x + xDiff,
            y: 中心点.y + yDiff
        }
    };
}

// 计算元素渐变线
export const 计算元素渐变线 = (元素, 渐变角度, isRadial = false) => {
    let 渐变框边界 = 获取元素边界(元素);
    let 渐变线长度 = 计算渐变线长度(渐变框边界, 渐变角度);
    let 中心点 = 计算中心点(渐变框边界);
    let { start, end } = 计算起点和终点(中心点, 渐变线长度, 渐变角度);

    if (isRadial) {
        // 对于环形渐变，起点和终点都是中心点，长度是元素的对角线的一半
        start = 中心点;
        渐变线长度 = Math.sqrt(Math.pow(渐变框边界.width, 2) + Math.pow(渐变框边界.height, 2)) / 2;
        // 计算对焦点作为终点
        end = {
            x: 中心点.x + 渐变框边界.width / 2,
            y: 中心点.y + 渐变框边界.height / 2
        };
    }

    return {
        length: 渐变线长度,
        center: 中心点,
        start: start,
        end: end
    };
}
export const 计算事件在线上的最近点 = (event, 线定义) => {
    let x = event.clientX, y = event.clientY
    return 相对线计算点的垂点({ x, y }, 线定义)
}
