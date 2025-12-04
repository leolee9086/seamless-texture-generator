import Pickr from '../../../static/pickr-esm2022.js'
let pickrInstance = null;
export const  isColorDark=(color)=> {
    // 将颜色转换为RGB格式
    let rgb;
    if (color.startsWith('#')) {
        let hex = color.substring(1);
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);
        rgb = { r, g, b };
    } else {
        // 假设颜色已经是RGB格式
        let match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        rgb = { r: match[1], g: match[2], b: match[3] };
    }
    // 计算亮度
    let luma = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b; // ITU-R BT.709
    // 如果亮度小于128，那么颜色就是深色
    return luma < 128;
}
export const 打开颜色选择器=(目标元素,options={})=>{
    let {onchange,onsave,onshow}=options
    if(pickrInstance){
        pickrInstance.destroyAndRemove();
        pickrInstance=undefined
    }
    if (!pickrInstance) {
        pickrInstance = Pickr.create({
            el: 目标元素,
            theme: 'classic',
            default:options.default|| '#42445a',
            useAsButton: true,
            inline: false,    
            swatches: [
                'rgba(244, 67, 54, 1)',
                'rgba(233, 30, 99, 0.95)',
                'rgba(156, 39, 176, 0.9)',
                'rgba(103, 58, 183, 0.85)',
                'rgba(63, 81, 181, 0.8)',
                'rgba(33, 150, 243, 0.75)',
                'rgba(3, 169, 244, 0.7)',
                'rgba(0, 188, 212, 0.7)',
                'rgba(0, 150, 136, 0.75)',
                'rgba(76, 175, 80, 0.8)',
                'rgba(139, 195, 74, 0.85)',
                'rgba(205, 220, 57, 0.9)',
                'rgba(255, 235, 59, 0.95)',
                'rgba(255, 193, 7, 1)'
            ],
            components: {
                preview: true,
                opacity: true,
                hue: true,
                interaction: {
                    hex: true,
                    rgba: true,
                    hsla: true,
                    hsva: true,
                    cmyk: true,
                    input: true,
                    clear: true,
                    save: true,
                }
            }
        });
        // 添加颜色选择器的事件监听器
        pickrInstance.on('save', (color, instance) => {
            onsave&&onsave(color, instance)
        });
        pickrInstance.on('change', (color, instance) => {
            onchange&&onchange(color, instance)
        });
        pickrInstance.on('show', (color, instance) => {
            onshow&&onshow(color, instance)
        });
    }
    pickrInstance.show();
    return pickrInstance

}