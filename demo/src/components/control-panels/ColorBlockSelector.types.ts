import type { AdjustmentLayer, RGBColor, HSLRange } from './imports'

export interface ColorBlockSelectorEmits {
    (e: 'add-color-layer', color: RGBColor): void
    (e: 'add-hsl-layer', hslBlock: HSLRange): void
    (e: 'remove-layer', id: string): void
    (e: 'select-layer', id: string): void
    (e: 'update-layer', id: string, updates: Partial<AdjustmentLayer>): void
}

export interface ColorBlockSelectorProps {
    processing: boolean
    quantizedColorBlocks: RGBColor[]
    commonHslBlocks: HSLRange[]
    layers: AdjustmentLayer[]
    activeLayerId: string | null
    mode?: 'full' | 'add-only' | 'settings-only' | 'list-only'
    isMobile: boolean
}