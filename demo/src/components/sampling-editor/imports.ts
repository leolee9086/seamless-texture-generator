/**
 * SamplingEditor 模块的外部依赖转发
 * 按照架构规则，所有外部/父级导入必须通过本文件转发
 */

// Vue 核心
import { ref, computed, watch, onMounted, onBeforeUnmount, onUnmounted, toRef, nextTick } from 'vue'
import type { Ref } from 'vue'
export { ref, computed, watch, onMounted, onBeforeUnmount, onUnmounted, toRef, nextTick }
export type { Ref }

// 工具函数 - 透视变换
import { warpPerspective } from '../../utils/homography'
export { warpPerspective }

// 工具函数 - 几何计算
import { getDistance, getCenter } from '../../utils/geometry'
export { getDistance, getCenter }

// Composable - 采样点逻辑
import { useSamplingPoints } from '../../composables/useSamplingPoints'
export { useSamplingPoints }


