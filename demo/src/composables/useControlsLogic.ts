import { computed, ref } from 'vue'
import { createButtonClickEvent, createUpdateDataEvent } from '../types/controlEvents'
import type { ControlEvent } from '../types/controlEvents'

export interface ControlsProps {
  isProcessing: boolean
  originalImage: string | null
  processedImage: string | null
  maxResolution: number
  borderSize: number
  splitPosition: number
  magnifierEnabled: boolean
  zoomLevel: number
  lutEnabled: boolean
  lutIntensity: number
  lutFileName: string | null
}

export function useControlsLogic(props: ControlsProps, emit: (event: 'controlEvent', payload: ControlEvent) => void) {
  const activeGroup = ref('inputs')

  const groups = [
    { id: 'contact', icon: 'i-carbon-favorite', label: 'Contact & Sponsor', component: 'ContactPanel' },
    { id: 'inputs', icon: 'i-carbon-image-search', label: 'Inputs', component: 'InputsPanel' },
    { id: 'crop', icon: 'i-carbon-crop', label: 'Crop', component: 'CropPanel' },
    { id: 'lut', icon: 'i-carbon-color-palette', label: 'LUT', component: 'LUTPanel' },
    { id: 'hsl', icon: 'i-carbon-color-switch', label: 'HSL', component: 'HSLPanel' },
    { id: 'exposure', icon: 'i-carbon-sun', label: 'Exposure', component: 'ExposurePanel' },  // 新增曝光调整
    { id: 'dehaze', icon: 'i-carbon-fog', label: 'Dehaze', component: 'DehazePanel' },  // 新增去雾调整
    { id: 'tileablesettings', icon: 'i-carbon-settings-adjust', label: 'Settings', component: 'SettingsPanel' },
    { id: 'view', icon: 'i-carbon-view', label: 'View', component: 'ViewPanel' },
    { id: 'save', icon: 'i-carbon-save', label: 'Save', component: 'SavePanel' },
  ]

  // Sliders for Inputs Group
  const inputSliderItems = computed(() => {
    if (!props.originalImage) return []
    return [{
      id: 'max-resolution',
      label: 'Max Res',
      value: props.maxResolution,
      min: 512,
      max: 4096,
      step: 128,
      valuePosition: 'after' as const,
      showRuler: false
    }]
  })

  // Sliders for Settings Group
  const settingsSliderItems = computed(() => {
    if (!props.originalImage) return []
    return [{
      id: 'border-size',
      label: 'Border (%)',
      value: props.borderSize,
      min: 0,
      max: 100,
      step: 1,
      valuePosition: 'after' as const,
      showRuler: false
    }]
  })

  // Sliders for LUT Group
  const lutSliderItems = computed(() => {
    if (!props.originalImage || !props.lutEnabled) return []
    return [{
      id: 'lut-intensity',
      label: 'Intensity',
      value: props.lutIntensity,
      min: 0,
      max: 1,
      step: 0.01,
      valuePosition: 'after' as const,
      showRuler: false
    }]
  })

  // Sliders for View Group
  const viewSliderItems = computed(() => {
    const items = []
    if (props.originalImage) {
      items.push({
        id: 'zoom-level',
        label: 'Zoom',
        value: props.zoomLevel,
        min: 0.01,
        max: 5,
        step: 0.01,
        valuePosition: 'after' as const,
        showRuler: false
      })
    }
    if (props.processedImage) {
      items.push({
        id: 'split-position',
        label: 'Split Pos',
        value: props.splitPosition,
        min: 0,
        max: 1,
        step: 0.01,
        valuePosition: 'after' as const,
        showRuler: false
      })
    }
    return items
  })

  const handleImageUpload = (event: Event) => {
    emit('controlEvent', createUpdateDataEvent('image-upload', event))
  }

  const loadSampleImage = () => {
    emit('controlEvent', createButtonClickEvent('load-sample-image'))
  }

  const updateMaxResolution = (value: number) => {
    emit('controlEvent', createUpdateDataEvent('max-resolution', value))
  }

  const updateBorderSize = (value: number) => {
    emit('controlEvent', createUpdateDataEvent('border-size', value))
  }

  const processImage = () => {
    emit('controlEvent', createButtonClickEvent('process-image'))
  }

  const updateSplitPosition = (value: number) => {
    emit('controlEvent', createUpdateDataEvent('split-position', value))
  }

  const toggleMagnifier = () => {
    emit('controlEvent', createButtonClickEvent('toggle-magnifier'))
  }

  const updateZoomLevel = (value: number) => {
    emit('controlEvent', createUpdateDataEvent('zoom-level', value))
  }

  const handleSliderUpdate = ({ id, value }: { id: string; value: number }) => {
    switch (id) {
      case 'max-resolution':
        updateMaxResolution(value)
        break
      case 'border-size':
        updateBorderSize(value)
        break
      case 'split-position':
        updateSplitPosition(value)
        break
      case 'zoom-level':
        updateZoomLevel(value)
        break
      case 'lut-intensity':
        emit('controlEvent', createUpdateDataEvent('lut-intensity', value))
        break
    }
  }

  const toggleLUT = () => {
    emit('controlEvent', createButtonClickEvent('toggle-lut'))
  }

  const handleLUTFileChange = (file: File) => {
    emit('controlEvent', createUpdateDataEvent('lut-file-change', file))
  }

  const clearLUT = () => {
    emit('controlEvent', createButtonClickEvent('clear-lut'))
  }

  const resetZoom = () => {
    emit('controlEvent', createButtonClickEvent('reset-zoom'))
  }

  const openSamplingEditor = () => {
    emit('controlEvent', createButtonClickEvent('open-sampling-editor'))
  }

  const saveOriginal = () => {
    emit('controlEvent', createButtonClickEvent('save-original'))
  }

  const saveResult = () => {
    emit('controlEvent', createButtonClickEvent('save-result'))
  }

  const handleControlEvent = (event: ControlEvent) => {
    emit('controlEvent', event)
  }

  return {
    activeGroup,
    groups,
    inputSliderItems,
    settingsSliderItems,
    lutSliderItems,
    viewSliderItems,
    handleImageUpload,
    loadSampleImage,
    updateMaxResolution,
    updateBorderSize,
    processImage,
    updateSplitPosition,
    toggleMagnifier,
    updateZoomLevel,
    handleSliderUpdate,
    resetZoom,
    openSamplingEditor,
    saveOriginal,
    saveResult,
    toggleLUT,
    handleLUTFileChange,
    clearLUT,
    handleMaskUpdate: (maskGenerator: (() => Promise<Uint8Array | null>) | null) => {
      emit('controlEvent', createUpdateDataEvent('mask-update', maskGenerator))
    },
    handleControlEvent
  }
}