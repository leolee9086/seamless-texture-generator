<template>
    <div class="gradient-line" v-if="聚焦" ref="gradientLine" :style="gradientLineStyle()">
        <div :style="
            `height:28px;
                        width:0.5px;
                        position:absolute;
                        left:${位置序列[percent]};
                        top:-14px;
                        border:solid 1px`" v-for="(i, percent) in 颜色值序列 " :ref="percent" :class="percent">
            <div :style="`width:10px;
                                height:10px;
                                position:absolute;
                                background-color:${颜色值序列[percent]};
                                top:9px;
                                left:-5.5px;
                                border:solid 1px;
                                border-radius:100%
                                `">
            </div>
        </div>
        <div v-if="正在编辑" :style="`height:100%;
                        width:1px;
                        position:absolute;
                        left:${临时位置};
                        top:0;
                        border:solid 1px`" ref="tempnode" class="tempnode" @mouseup="固定临时位置()">
            <div :style="`width:10px;
                                    height:10px;
                                    position:absolute;
                                    background-color:${临时颜色};
                                    top:37px;
                                    left:-5.5px;
                                    border:solid 1px;
                                    border-radius:100%
                                `">
            </div>
        </div>
    </div>
</template>
<script>
</script>