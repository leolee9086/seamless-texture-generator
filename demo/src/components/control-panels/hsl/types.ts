import type { HSLRange } from '../../../utils/lut/hslMask'

export interface CommonHslBlocksProps {
    commonHslBlocks: HSLRange[]
    isMobile: boolean
}

export interface CommonHslBlocksEmits {
    (e: 'add-hsl-layer', hslBlock: HSLRange): void
}