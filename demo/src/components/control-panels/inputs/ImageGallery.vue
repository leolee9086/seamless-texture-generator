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
          :src="imageUrl"
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
import { fetchImageAsBase64 } from './imports'
import type { ImageGalleryProps } from './TextToImageTabContent.types'

const props = defineProps<ImageGalleryProps>()

/**
 * 处理图像点击事件
 */
const handleImageClick = async (imageUrl: string): Promise<void> => {
  try {
    const base64 = await fetchImageAsBase64(imageUrl)
    props.onImageClick?.(base64)
  } catch (error) {
    console.error('Failed to load image:', error)
  }
}
</script>