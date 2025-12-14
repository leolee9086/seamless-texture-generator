/**
 * GPU资源池类，用于管理GPU资源的创建、复用和释放
 * 通过资源池可以避免频繁创建和销毁GPU资源带来的性能开销
 */
export class ResourcePool {
    public device: GPUDevice
    private buffers = new Map<string, { buffer: GPUBuffer; refCount: number }>()
    private textures = new Map<string, { texture: GPUTexture; refCount: number }>()
    private mappedBuffers = new Set<GPUBuffer>()

    constructor(device: GPUDevice) {
        this.device = device
    }

    async getBuffer(size: number, usage: GPUBufferUsageFlags, label = ''): Promise<GPUBuffer> {
        const key = `${size}_${usage}_${label}`
        let buffer: GPUBuffer | undefined

        if (this.buffers.has(key)) {
            const bufferEntry = this.buffers.get(key)!
            buffer = bufferEntry.buffer
            bufferEntry.refCount++

            if (buffer) {
                // 如果缓冲区已映射，尝试取消映射
                if (this.mappedBuffers.has(buffer)) {
                    try {
                        buffer.unmap()
                        this.mappedBuffers.delete(buffer)
                    } catch {
                        // 忽略未映射缓冲区的错误
                    }
                }
                return buffer
            }
        }

        // 创建新的缓冲区
        buffer = this.device.createBuffer({
            size,
            usage,
            label: `pool_buffer_${label}`
        })

        this.buffers.set(key, { buffer, refCount: 1 })

        return buffer
    }

    markBufferMapped(buffer: GPUBuffer): void {
        this.mappedBuffers.add(buffer)
    }

    markBufferUnmapped(buffer: GPUBuffer): void {
        this.mappedBuffers.delete(buffer)
    }

    getTexture(width: number, height: number, format: GPUTextureFormat, usage: GPUTextureUsageFlags, label = ''): GPUTexture {
        const key = `${width}_${height}_${format}_${usage}_${label}`
        if (this.textures.has(key)) {
            const textureEntry = this.textures.get(key)!
            textureEntry.refCount++
            return textureEntry.texture
        }

        // 创建新的纹理
        const texture = this.device.createTexture({
            size: [width, height],
            format,
            usage,
            label: `pool_texture_${label}`
        })

        this.textures.set(key, { texture, refCount: 1 })
        return texture
    }

    releaseBuffer(buffer: GPUBuffer): void {
        for (const [key, entry] of this.buffers.entries()) {
            if (entry.buffer === buffer) {
                entry.refCount--
                if (entry.refCount <= 0) {
                    if (this.mappedBuffers.has(buffer)) {
                        try {
                            buffer.unmap()
                        } catch {
                            // 忽略清理错误
                        }
                        this.mappedBuffers.delete(buffer)
                    }
                    this.buffers.delete(key)
                }
                break
            }
        }
    }

    releaseTexture(texture: GPUTexture): void {
        for (const [key, entry] of this.textures.entries()) {
            if (entry.texture === texture) {
                entry.refCount--
                if (entry.refCount <= 0) {
                    this.textures.delete(key)
                }
                break
            }
        }
    }
}
