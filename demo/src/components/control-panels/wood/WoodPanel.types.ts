import type { WoodParams, SliderItem, ProceduralTextureState } from './imports'

export interface WoodPanelEmits {
    'set-image': [imageData: string]
}

export interface WoodPanelProps {
    isGenerating: boolean
}

export interface WoodPanelLogicReturn {
    pendingGeneration: { value: boolean }
    localIsGenerating: { value: boolean }
    generateWood: () => Promise<void>
    applyPreset: (preset: Partial<WoodParams>) => void
    woodPresets: Record<string, Partial<WoodParams>>
}


export interface WoodPanelGenerateEmits {
    'generate': []
}

export interface WoodPanelSectionsEmits {
    'update-param': [data: { id: string; value: number }]
    'apply-preset': [preset: Partial<WoodParams>]
}

export interface WoodPanelParamsSectionProps {
    title: string
    modelValueKey: keyof ProceduralTextureState['uiState']['woodPanel']
    items: SliderItem[]
}

export interface WoodPanelParamsSectionEmits {
    'update-param': [data: { id: string; value: number }]
}

// 滑块工具相关类型
export interface SliderConfig {
    id: string
    label: string
    min: number
    max: number
    step: number
    valuePosition?: 'before' | 'after'
    showRuler?: boolean
}

export type ParamValueGetter = (state: ProceduralTextureState) => number