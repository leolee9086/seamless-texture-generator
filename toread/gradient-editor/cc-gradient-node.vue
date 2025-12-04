<template>
    <div 
        :style="`height:28px;
                width:1px;
                position:absolute;
                left:${位置序列[percent]};
                top:0;
                border:solid 1px`" 
        v-for="(i, percent) in 颜色值序列 " 
        :ref="percent" 
    :class="percent">
        <div 
            :style="`width:10px;
            height:10px;
            position:absolute;
            background-color:${颜色值序列[percent]};
            top:28px;
            left:-5.5px;
            border:solid 1px;
            border:
            `">
        </div>
    </div>
</template>
<script>
export default {
  props: ['percent', '位置序列', '颜色值序列'],
  computed: {
    nodeStyle() {
      return `width:6px;
              height:28px;
              left:${this.位置序列[this.percent]};`
    }
  },
  methods: {
    暂时删除节点(percent) {
      this.$emit('delete-node', percent);
    }
  }
}
</script>

<style scoped>
.node-back-ground {
  position: absolute;
  top: 0;
  z-index: 999;
}
</style>