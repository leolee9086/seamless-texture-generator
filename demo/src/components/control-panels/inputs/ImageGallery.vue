<template>
  <div v-if="imageUrls.length > 0" class="mt-4">
    <h3 class="text-sm font-medium text-white/70 mb-2">生成的图像</h3>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
      <div
        v-for="(imageUrl, index) in imageUrls"
        :key="index"
        class="relative group cursor-pointer"
        @click="handleImageClick(imageUrl)"
      >
        <img
          :src="cachedImageUrls[index]"
          :alt="`生成的图像 ${index + 1}`"
          class="w-full h-32 object-cover rounded-lg border border-gray-600 group-hover:border-blue-400 transition-colors"
          loading="lazy"
        />
        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg" />
        <div class="absolute bottom-2 left-2 text-xs text-white bg-black bg-opacity-60 px-2 py-1 rounded">
          图像 {{ index + 1 }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getCachedImageByUrl } from './TextToImageTabContent.cache'
import type { ImageGalleryProps } from './TextToImageTabContent.types'
const props = defineProps<ImageGalleryProps>()

/**
 * 将 URL 转换为缓存的 base64 数据
 * 假设缓存已经存在，如果不存在则返回空字符串（图像将无法显示）
 */
const cachedImageUrls = computed(() => {
  return props.imageUrls.map(url => {
    const cached = getCachedImageByUrl(url)
    // 如果缓存不存在，返回空字符串，图像将无法显示
    // 这符合"图像只能在缓存成功之后显示"的要求
    return cached || ''
  })
})

/**
 * 处理图像点击事件
 */
const handleImageClick = async (imageUrl: string): Promise<void> => {
  try {
    // 首先尝试从缓存中获取图片
    const cachedImage = getCachedImageByUrl(imageUrl)
    if (cachedImage) {
      props.onImageClick?.(cachedImage)
      return
    }

    throw new Error("图片没有正确缓存")
  } catch (error) {
    console.error('Failed to load image:', error)
    // 可以在这里添加用户友好的错误提示
  }
}
</script>