<template>
  <component :is="isLink ? 'a' : 'div'" 
             :href="href" 
             @click="handleClick"
             class="uni-navigator">
    <slot></slot>
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  url: String,
  hoverClass: String,
  hoverStartTime: Number,
  hoverStayTime: Number,
  openType: String
})

const router = useRouter()

const isLink = computed(() => {
  return props.url && (props.url.startsWith('http://') || props.url.startsWith('https://'))
})

const href = computed(() => {
  return isLink.value ? props.url : undefined
})

const handleClick = (e) => {
  if (isLink.value) return
  
  if (props.url) {
    const url = props.url.startsWith('/') ? props.url : '/' + props.url
    const [path, query] = url.split('?')
    const params = {}
    
    if (query) {
      query.split('&').forEach(param => {
        const [key, value] = param.split('=')
        params[key] = decodeURIComponent(value || '')
      })
    }
    
    router.push({ path, query: params })
  }
}
</script>

<style scoped>
.uni-navigator {
  display: inline-block;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

.uni-navigator:hover {
  opacity: 0.8;
}
</style>
