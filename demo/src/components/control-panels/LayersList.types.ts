import type { AdjustmentLayer } from './imports'

export interface LayersListEmits {
    (e: 'select-layer', id: string): void
    (e: 'remove-layer', id: string): void
    (e: 'update-layer', id: string, updates: Partial<AdjustmentLayer>): void
}

export interface LayersListProps {
    layers: AdjustmentLayer[]
    activeLayerId: string | null
}