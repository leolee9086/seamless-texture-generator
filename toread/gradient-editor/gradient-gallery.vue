<template>
    <div class="block__logo">
        渐变
    </div>    
    <ccGradientSetter></ccGradientSetter>
    <div class="gradient-grid ">
    <button class="editor-button" 
      v-for="gradient in gradients" 
      :key="gradient.id"  
      :data-gradient="gradient.css"
      @click="渐变按钮点击回调"
      @click.right="渐变按钮右击回调"
      :style="{backgroundImage:gradient.css}">
    </button>
    <button class="editor-button" >+</button>
    </div>
  </template>
  <script>
  import eventBus from 'eventBus'
  export default {
    props: {
      gradients: {
        type: Array,
        required: true
      },
      columns: {
        type: Number,
        default: 6
      }
    },
    computed: {
      gridTemplateColumns() {
        return `repeat(${this.columns}, 1fr)`;
      }
    },
    methods:{
      渐变按钮点击回调(e){
        console.log(e.target)
        eventBus.emit('css-props-change',{
          backgroundImage:e.target.style.backgroundImage
        })
      },
      渐变按钮右击回调(e){
        eventBus.emit('css-backgroundImage-add',{
          css:e.target.getAttribute('data-gradient')
        })
      }
    }
  }
  </script>
  
  <style scoped>
  .gradient-grid {
    display: grid;
    gap: 10px;
  }
  .gradient-grid {
    grid-template-columns: v-bind(gridTemplateColumns);
  }
  .gradient-box {
    width: 100%;
    height: 100px;
    border-radius: 5px;
  }
  </style>