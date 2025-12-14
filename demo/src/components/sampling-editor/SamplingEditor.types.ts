export interface SamplingEditorProps {
    visible: boolean
    originalImage: string | null
}

export interface SamplingEditorEmit {
    (e: 'close'): void
    (e: 'confirm', imageData: string): void
}
