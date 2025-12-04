<template>
  <div class="knob-root" ref="root" :style="`width:${size||100}px;height:${size||100}px;flex:none`">
    <div
      :style="`
      width:${size||100}px;
      height:${size||100}px;
      max-width:${size||100}px;
      max-height:${size||100}px;
      min-width:${size||100}px;
      min-height:${size||100}px;
      flex:none;
      top:0;
      left:0;
      position:relative;`">

      <div id="knobcontainer" class="knobcontainer" ref="knobcontainer"
         v-on:mousedown="开始计算角度()">
        <div id="knobhandler" ref="knobhandler"></div>
        <div id="knobfinger" ref="knobfinger">
          <div></div>
        </div>
      </div>
    </div>

  </div>
</template>
<script>
import 计算二维向量象限 from '../utils/geometryProcessor.js'
export default {
  name: "cc-knob",
  props: ["size", "value"],
  model: { event: "change", prop: "value" },
  mounted() {
    this.$refs.root.style.width = this.size + "px";
    this.$refs.root.style.height = `${this.size}px`;
  //  this.$refs.knobhandler.style.top = `${this.size * 0.5 - 6}px`;
   // this.$refs.knobfinger.style.top = `${this.size * 0.5 - 12 - 0.5}px`;
  },
  data() {
    return {
      角度: 90,
      距离: "",
      位移向量: "",
    };
  },
  watch: {
    size(val) {
      this.$refs.root.style.width = val + "px";
      this.$refs.root.style.height = `${val}px`;
      this.$refs.knobhandler.style.top = `${val * 0.5 - 6}px`;
      this.$refs.knobfinger.style.top = `${val * 0.5 - 12 - 0.5}px`;
    },
  },
  methods: {
    开始计算角度() {
      window.document.addEventListener("mousemove", this.计算角度);
      window.document.addEventListener("click", this.移除监听);
    },
    移除监听() {
      window.document.removeEventListener("mousemove", this.计算角度);
      window.document.removeEventListener("click", this.移除监听);
      this.$emit("change", this.角度);
    },
    计算角度: async function (event) {
      event.stopPropagation();
      let 旋钮容器 = this.$refs.knobcontainer;
      let 容器半宽 = 旋钮容器.offsetWidth / 2;
      let 容器半高 = 旋钮容器.offsetHeight / 2;
      let 容器中心点 = {
        x: 旋钮容器.getBoundingClientRect().left + 容器半宽,
        y: 旋钮容器.getBoundingClientRect().top + 容器半高,
      };
      let 鼠标所在点 = { x: event.clientX, y: event.clientY };
      let 角度向量 = { x: 鼠标所在点.x - 容器中心点.x, y: 鼠标所在点.y - 容器中心点.y };
      let 象限 = this.象限判断(角度向量);
      let 角度 = (360 * Math.atan(角度向量.y / 角度向量.x)) / (2 * Math.PI);
      let 弧度 = Math.atan(角度向量.y / 角度向量.x);
      this.角度 = 角度;
      this.距离 = Math.sqrt(Math.pow(角度向量.y, 2) + Math.pow(角度向量.x, 2));
      let 控制点 = this.$refs.knobhandler;
      let 指针 = this.$refs.knobfinger;
      if (this.距离 > this.size / 2 - 10) {
        let 最大距离 = this.size / 2 - 10;
        角度向量 = { y: 最大距离 * Math.sin(弧度), x: 最大距离 * Math.cos(弧度) };
        switch (象限) {
          case "第一象限":
            角度向量.x = 角度向量.x;
            角度向量.y = 角度向量.y;
            break;
          case "第二象限":
            角度向量.x = -角度向量.x;
            角度向量.y = -角度向量.y;
            break;
          case "第三象限":
            角度向量.x = -角度向量.x;
            角度向量.y = -角度向量.y;
            break;
          case "第四象限":
            角度向量.x = 角度向量.x;
            角度向量.y = 角度向量.y;
            break;
        }
      }
      switch (象限) {
        case "第一象限":
          角度 = 180 + 角度;
          break;
        case "第四象限":
          角度 = 180 + 角度;
          break;
        case "第三象限":
          角度 = 360 + 角度;
          break;
      }
      控制点.style.top = 容器半高 + 角度向量.y - 10 + "px";
      控制点.style.left = 角度向量.x + "px";
      let 新位置 = {
        x: 角度向量.x + 容器半宽,
        y: 角度向量.y + 容器半高
      };

      // 检查新位置是否在knobcontainer的圆形区域内
      let x距离 = 新位置.x - 容器半宽;
      let y距离 = 新位置.y - 容器半高;
      let 距离平方 = x距离 * x距离 + y距离 * y距离;
      let 半径平方 = 容器半宽 * 容器半宽;

      if (距离平方 > 半径平方) {
        // 如果新位置在圆形区域外，将其调整到最近的边界上
        let 比例 = Math.sqrt(半径平方 / 距离平方);
        新位置.x = 容器半高 + x距离 * 比例;
        新位置.y = 容器半高 + y距离 * 比例;
      }

      // 更新knobhandler的位置
      控制点.style.top = 新位置.y - 10 + "px";
      控制点.style.left = 新位置.x - 10 + "px";

      指针.style.transform = `rotate(${角度}deg)`;
      this.角度 = 角度;
      this.位移向量 = 角度向量;
      this.$emit("change", {角度:this.角度,弧度:弧度,角度向量:角度向量});
      this.$emit("update:modelValue", this.角度);
    },
    象限判断(位移向量) {
      let x = 位移向量["x"];
      let y = 位移向量["y"];
      let 象限 = "第一象限";
      if (x > 0 && y > 0) {
        象限 = "第四象限";
      }
      if (x > 0 && y < 0) {
        象限 = "第一象限";
      }
      if (x < 0 && y < 0) {
        象限 = "第二象限";
      }
      if (x < 0 && y > 0) {
        象限 = "第三象限";
      }
      return 象限;
    },
  },
};
</script>
<style scoped>
.knobcontainer {
  padding: 0px;
  margin: 0%;
  position: relative;

}

.knob-root,
.knobcontainer {
  min-width: 100%;
  min-height: 100%;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;

  padding: 0px;
  margin: 0%;
  flex: 0 0 auto;

}

.knobcontainer {
  padding: 0px;
  margin: 0%;
  border: solid 2px lightblue;
  border-radius: 100%;
  background-color: transparent;

}

#knobhandler {
  width: 10px;
  height: 10px;
  border: solid 1px;
  border-radius: 100%;
  position: absolute;
  margin: auto;
  top: calc(50% - 5px);
  left: calc(50% - 5px);
  background-color: white;
  z-index: 255;
}

#knobfinger {
  width: 100%;
  height: 1px;
  position: absolute;
  top: calc(50% - 0.5px);
  left: 0;
  margin: auto;
}

#knobfinger div {
  width: 50%;
  height: 100%;
  background-color: rgb(118, 230, 230);
}
</style>
