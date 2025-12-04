<template>
    <div id="root" ref="root" style="position:relative" @mouseover="聚焦 = true">
        <div :gradient="渐变值" :lines="渐变线条" class="preview" ref="preview" @click.right="isRadial = !isRadial" @mouseup="添加节点值($event)"
            @mousemove="编辑节点值($event)" @mouseover="聚焦 = true" @mouseleave="聚焦 = false" :style="{ backgroundImage: 渐变定义 }">
            <ccKnob v-if="编辑角度 && !isRadial" :size="100" v-model="渐变角度" @mouseover="聚焦 = true"
                :style="`position:relative;left:${宽度 - 30}px`">
            </ccKnob>
        </div>
    </div>
    <div class="gradient-start-point" @mouseover="聚焦 = true" v-if="聚焦" :style="gradientStartPointStyle()"></div>
    <div class="gradient-start-point" @mouseover="聚焦 = true" v-if="聚焦" :style="gradientEndPointStyle()"></div>
    <div class="gradient-start-point" @mouseover="聚焦 = true" v-if="聚焦" :style="计算映射点样式()"></div>
    <div @mouseover="聚焦 = true" class="gradient-line" v-if="聚焦" ref="gradientLine" :style="gradientLineStyle()">
        <template v-if="聚焦" v-for="(i, percent) in 颜色值序列 ">
            <div :style="
                `height:28px; width:0.5px;position:absolute;left:${位置序列[percent]};top:-14px;border:solid 1px`"
                :ref="percent" :class="percent">
                <div @mousedown.stop.prevent.capture="打开色值颜色选择器($event, { percentage: percent, color: 颜色值序列[percent] }, true)"
                    :style="`width:10px;height:10px; position:absolute;background-color:${颜色值序列[percent]};top:9px; left:-5.5px;border:solid 1px; border-radius:100%; z-index:100`">
                </div>
            </div>
        </template>
        <div v-if="聚焦 && 正在编辑" :style="`height:100%;width:1px;position:absolute;left:${临时位置};top:0;border:solid 1px`"
            ref="tempnode" class="tempnode" @mouseup="固定临时位置()">
            <div
                :style="`width:10px; height:10px; position:absolute; background-color:${临时颜色};top:37px; left:-5.5px;border:solid 1px;border-radius:100%`">
            </div>
        </div>
    </div>
    <template v-for="item in 排序色值序列">
        <div @mouseover="聚焦 = true" @click="打开色值颜色选择器($event, item)"
            :style="{ backgroundColor: item.color, 'user-select': 'none' }" @click.right="删除节点(item.percentage)">
            {{ item.percentage }}: {{ item.color }}
        </div>
    </template>
</template>
<script>
import ccKnob from "./cc-knob.vue"
import { 计算元素渐变线, 计算事件在线上的最近点 } from "../utils/gradientProcessor.js"
import { isColorDark } from "../utils/colorProcessor.js"
import _chroma from '../../../static/chroma-js.js';
import { 打开颜色选择器 } from '../utils/colorProcessor.js'

const chroma = _chroma.default

export default {
    name: "cc-gradient-setter",
    props: ["value", "宽度", "自定义颜色数组"],
    model: { event: "change", prop: "value" },
    components: { ccKnob },
    mounted() {
        this.isMounted = true
        this.$refs.preview.style.backgroundImage = "linear-gradient(" + this.渐变角度 + "deg" + this.渐变定义 + ")"
        this.$refs.preview.style.width = `${this.宽度 - 50}px`
    },
    data() {
        return {
            渐变角度: 90,
            颜色值序列: {},
            当前百分比: 0,
            显示颜色面板: false,
            isMounted: false,
            改变节点位置: false,
            临时百分比: "",
            临时颜色: "",
            临时位置: "",
            正在编辑: false,
            聚焦: false,
            编辑角度: true,
            当前映射点坐标: {},
            isRadial: true,
            渐变值:"",
            渐变线条:""
        }
    },
    computed: {
        渐变定义() {
            if (!this.isMounted) {
                console.log("组件已销毁")
                return "";
            }
            let 颜色渐变字符串 = "";
            let 线条渐变字符串 = "";
            let arry = [];
            for (let 节点 in this.颜色值序列) {
                arry.push({ "index": parseFloat(节点.replace("%", "")), "value": 节点 });
            }
            if (this.临时百分比) {
                arry.push({ "index": parseFloat(this.临时百分比.replace("%", "")), "value": this.临时百分比 });
            }
            arry.sort((x, y) => x.index - y.index);
            arry.forEach((el, index) => {
                let color = this.颜色值序列[el["value"]] || this.临时颜色;
                let lineColor = isColorDark(color) ? 'white' : 'black'; // 判断颜色是否深色
                颜色渐变字符串 += `, ${color} ${el["value"]}`;
                let currentPercent = parseFloat(el["value"]);
                let lineStart = currentPercent - 0.1;
                let lineEnd = currentPercent + 0.1;

                线条渐变字符串 += `, transparent ${lineStart}%, ${lineColor} ${currentPercent}%, transparent ${lineEnd}%`;

            });
            let 角度字符串 = this.渐变角度 + "deg";
            if (this.isRadial) {
                颜色渐变字符串 = "radial-gradient(circle" + 颜色渐变字符串 + ")";
                线条渐变字符串 = "radial-gradient(circle" + 线条渐变字符串 + ")";
            } else {
                颜色渐变字符串 = "linear-gradient(" + 角度字符串 + 颜色渐变字符串 + ")";
                线条渐变字符串 = "linear-gradient(" + 角度字符串 + 线条渐变字符串 + ")";
            }
            this.渐变值=颜色渐变字符串
            this.渐变线条=线条渐变字符串
            return 线条渐变字符串 + ", " + 颜色渐变字符串;
        },
        位置序列() {
            if (!this.isMounted) {
                return { "0%": 0, "100%": 600 }
            }
            let obj = {}
            for (let 百分比 in this.颜色值序列) {
                let el = this.$refs.gradientLine
                el && (obj[百分比] = el.offsetWidth * parseFloat(百分比) / 100 - 1.5 + "px")
            }
            return obj
        },
        排序色值序列: {
            get() {
                // Convert the object to an array
                let array = Object.entries(this.颜色值序列).map(([percentage, color]) => ({ percentage, color }));

                // Sort the array by percentage
                array.sort((a, b) => parseFloat(a.percentage) - parseFloat(b.percentage));

                return array;
            },
            set(newValue) {
                // Convert the array back to an object
                this.颜色值序列 = Object.fromEntries(newValue.map(({ percentage, color }) => [percentage, color]));
            }
        }

    },
    watch: {
        临时百分比(val) {
            if (this.临时百分比) {
                let el = this.$refs.gradientLine
                this.临时位置 = el.offsetWidth * parseFloat(val) / 100 - 1.5 + "px"
            }
        },
        渐变定义: {
            handler(val) {
                this.应用(val)
            }
        }
    },
    methods: {
        打开色值颜色选择器($event, item, useGlobal) {
            let options = {
                default: item.color,
                onchange: (color, instance) => {
                    this.颜色值序列[item.percentage] = color.toHEXA().toString()
                },
                onshow: (color, instance) => {
                    useGlobal ? setTimeout(() => {
                        instance.getRoot().app.style.top = $event.clientY + "px";
                        instance.getRoot().app.style.left = $event.clientX + "px";

                    }, 50) : null
                }
            }
            let instance = 打开颜色选择器($event.target, options)

        },
        计算映射点(event) {
            let gradientLine = this.计算渐变线();
            return 计算事件在线上的最近点(event, gradientLine)
        },
        计算映射点样式() {
            return {
                left: `${this.当前映射点坐标.x}px`,
                top: `${this.当前映射点坐标.y}px`,
            };
        },
        gradientLineStyle() {
            let gradientLine = this.计算渐变线();
            let obj = {
                left: `${gradientLine.center.x}px`,
                top: `${gradientLine.center.y}px`,
                width: `${gradientLine.length}px`,
                transform: `translate(-50%, -50%) rotate(${this.渐变角度 + 270}deg)`,
                backgroundImage: this.$refs.preview.style.backgroundImage
            };
            if (this.isRadial) {
                obj.transform = ``
            }
            return obj
        },
        gradientStartPointStyle() {
            let gradientLine = this.计算渐变线();
            return {
                left: `${gradientLine.start.x}px`,
                top: `${gradientLine.start.y}px`,
                transform: 'translate(-50%, -50%)'
            };
        },
        gradientEndPointStyle() {
            let gradientLine = this.计算渐变线();
            return {
                left: `${gradientLine.end.x}px`,
                top: `${gradientLine.end.y}px`,
                transform: 'translate(-50%, -50%)'
            };
        },
        固定临时位置() {
            this.颜色值序列[this.临时百分比] = this.临时颜色
            this.颜色值序列 = JSON.parse(JSON.stringify(this.颜色值序列))
            this.临时颜色 = ""
            this.临时百分比 = ""
            this.临时位置 = ""
            this.正在编辑 = false
        },
        应用: async function (val) {
            this.$emit("change", val)
        },
        暂时删除节点(percent) {
            if (percent == this.临时百分比) { return }
            this.临时百分比 = percent
            this.临时颜色 = this.颜色值序列[percent] + ""
            delete (this.颜色值序列[percent])
            this.正在编辑 = true
            this.颜色值序列 = JSON.parse(JSON.stringify(this.颜色值序列))
        },
        编辑节点值(event) {
            this.当前映射点坐标.x = this.计算映射点(event).x
            this.当前映射点坐标.y = this.计算映射点(event).y
            if (!this.临时颜色) { return }
            this.临时百分比 = Math.round(event.offsetX / event.target.offsetWidth * 10000) / 100 + "%"
        },
        删除节点(percent) {
            delete (this.颜色值序列[percent])
            this.颜色值序列 = JSON.parse(JSON.stringify(this.颜色值序列))
        },
        添加节点值(event) {
            if (event.target.getAttribute("class") == "node-back-ground") { return }
            this.当前百分比 = Math.round(this.计算映射点(event).percentage)
            if (!this.颜色值序列[this.当前百分比 + "%"]) {
                if (Object.keys(this.颜色值序列).length === 0) {
                    // Generate two random colors
                    let color1 = '#' + (Math.floor(Math.random() * 16777215).toString(16)).padStart(6, '0');
                    let color2 = '#' + (Math.floor(Math.random() * 16777215).toString(16)).padStart(6, '0');

                    // Add the colors to the sequence
                    this.颜色值序列["0%"] = color1;
                    this.颜色值序列["100%"] = color2;
                }
                let keys = Object.keys(this.颜色值序列).map(key => parseFloat(key)).sort((a, b) => a - b);
                let previousColor = this.颜色值序列["0%"];
                let nextColor = this.颜色值序列["100%"];
                let previousKey = 0
                let nextKey = 100
                for (let i = 0; i < keys.length; i++) {
                    if (keys[i] > this.当前百分比) {
                        nextKey = keys[i];
                        nextColor = this.颜色值序列[nextKey + "%"];
                        break;
                    }
                    previousKey = keys[i];
                    previousColor = this.颜色值序列[previousKey + "%"];
                }

                // Generate a gradient color based on the percentage
                let scale = chroma.scale([previousColor, nextColor]).mode('lch');
                this.颜色值序列[this.当前百分比 + "%"] = scale((this.当前百分比 - previousKey) / (nextKey - previousKey)).hex();

                if (this.临时颜色) {
                    this.颜色值序列[this.当前百分比 + "%"] = this.临时颜色 + ""
                    this.临时颜色 = ""
                }
            }
            this.颜色值序列 = JSON.parse(JSON.stringify(this.颜色值序列))
        },
        计算渐变线() {
            if (!this.isMounted) {
                return {
                    length: 0,
                    center: { x: 0, y: 0 },
                    start: {
                        x: 0,
                        y: 0
                    },
                    end: {
                        x: 0,
                        y: 0
                    }
                };

            }
            return 计算元素渐变线(this.$refs.preview, this.渐变角度, this.isRadial)
        }
    }
}
</script>
<style scoped>
#root {
    background-color: var(--b3-theme-background)
}

.node-back-ground {
    position: absolute;
    top: 0;
    z-index: 999;
}

.node-back-ground:hover {
    background-color: rgba(211, 214, 29);
    z-index: 999;
}

.preview,
.root {
    width: 100%;
    height: 200px;
    border: solid 1px;
    border-radius: 5px
}

.gradient-start-point,
.gradient-end-point {
    width: 10px;
    height: 10px;
    background-color: red;
    border-radius: 50%;
    position: fixed;
}

.gradient-line {
    position: fixed;
    height: 2px;
    outline: 0.5px solid black;
    /* 调整这个值来改变线的粗细 */
    /* 这是一个示例的渐变，你可以根据需要修改 */
}
</style>