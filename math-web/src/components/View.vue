<template>
  <div :class="classes" :style="style">
    <slot></slot>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  hoverClass: String,
  hoverStartTime: Number,
  hoverStayTime: Number,
  hoverStopPropagation: Boolean,
  class: String,
  style: String
})

const classes = computed(() => {
  return props.class || ''
})
</script>

<style scoped>
div {
  box-sizing: border-box;
}
</style>
