/**
 * 颜色量化算法模块
 * 提供多种颜色量化算法，用于生成调色板和色彩分析
 */

/**
 * RGB颜色结构
 */
export interface RGBColor {
    r: number;
    g: number;
    b: number;
    count: number; // 该颜色在图像中的出现次数
}

/**
 * HSL颜色结构
 */
export interface HSLColor {
    h: number; // 色相 (0-360)
    s: number; // 饱和度 (0-100)
    l: number; // 明度 (0-100)
}

/**
 * 量化结果
 */
export interface QuantizationResult {
    palette: RGBColor[];
    colorMap: Map<string, RGBColor>; // 原始颜色到量化颜色的映射
    totalColors: number;
    originalColors: number;
}

/**
 * RGB转HSL
 */
export function rgbToHsl(r: number, g: number, b: number): HSLColor {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    return {
        h: h * 360,
        s: s * 100,
        l: l * 100
    };
}

/**
 * HSL转RGB
 */
export function hslToRgb(h: number, s: number, l: number): RGBColor {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p: number, q: number, t: number): number => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };

    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255),
        count: 0
    };
}

/**
 * 八叉树节点
 */
class OctreeNode {
    public children: (OctreeNode | null)[] = new Array(8).fill(null);
    public colors: RGBColor[] = [];
    public isLeaf: boolean = true;
    public level: number = 0;

    constructor(level: number = 0) {
        this.level = level;
    }

    /**
     * 添加颜色到节点
     */
    addColor(color: RGBColor): void {
        this.colors.push(color);
    }

    /**
     * 分割节点
     */
    split(): void {
        if (this.colors.length <= 1) return;

        const midR = this.colors.reduce((sum, c) => sum + c.r, 0) / this.colors.length;
        const midG = this.colors.reduce((sum, c) => sum + c.g, 0) / this.colors.length;
        const midB = this.colors.reduce((sum, c) => sum + c.b, 0) / this.colors.length;

        for (const color of this.colors) {
            const index = this.getChildIndex(color, midR, midG, midB);
            if (!this.children[index]) {
                this.children[index] = new OctreeNode(this.level + 1);
            }
            this.children[index]!.addColor(color);
        }

        this.isLeaf = false;
        this.colors = [];
    }

    /**
     * 获取子节点索引
     */
    private getChildIndex(color: RGBColor, midR: number, midG: number, midB: number): number {
        let index = 0;
        if (color.r > midR) index |= 1;
        if (color.g > midG) index |= 2;
        if (color.b > midB) index |= 4;
        return index;
    }

    /**
     * 获取平均颜色
     */
    getAverageColor(): RGBColor {
        if (this.colors.length === 0) {
            return { r: 0, g: 0, b: 0, count: 0 };
        }

        const totalCount = this.colors.reduce((sum, c) => sum + c.count, 0);
        const avgR = this.colors.reduce((sum, c) => sum + c.r * c.count, 0) / totalCount;
        const avgG = this.colors.reduce((sum, c) => sum + c.g * c.count, 0) / totalCount;
        const avgB = this.colors.reduce((sum, c) => sum + c.b * c.count, 0) / totalCount;

        return {
            r: Math.round(avgR),
            g: Math.round(avgG),
            b: Math.round(avgB),
            count: totalCount
        };
    }
}

/**
 * 八叉树量化算法
 */
export class OctreeQuantizer {
    private root: OctreeNode;
    private maxColors: number;

    constructor(maxColors: number = 256) {
        this.root = new OctreeNode();
        this.maxColors = maxColors;
    }

    /**
     * 量化图像
     */
    quantize(imageData: ImageData): QuantizationResult {
        // 统计颜色
        const colorMap = new Map<string, RGBColor>();
        const { data, width, height } = imageData;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const key = `${r},${g},${b}`;

            if (colorMap.has(key)) {
                colorMap.get(key)!.count++;
            } else {
                colorMap.set(key, { r, g, b, count: 1 });
            }
        }

        // 构建八叉树
        for (const color of colorMap.values()) {
            this.addColorToOctree(color);
        }

        // 减少颜色数量
        this.reduceColors();

        // 生成调色板
        const palette = this.generatePalette();
        const resultColorMap = this.createColorMap(palette, colorMap);

        return {
            palette,
            colorMap: resultColorMap,
            totalColors: palette.length,
            originalColors: colorMap.size
        };
    }

    /**
     * 添加颜色到八叉树
     */
    private addColorToOctree(color: RGBColor): void {
        let node = this.root;
        let level = 0;

        while (level < 8) {
            if (node.isLeaf) {
                node.addColor(color);
                break;
            }

            const midR = node.colors.reduce((sum, c) => sum + c.r, 0) / node.colors.length;
            const midG = node.colors.reduce((sum, c) => sum + c.g, 0) / node.colors.length;
            const midB = node.colors.reduce((sum, c) => sum + c.b, 0) / node.colors.length;

            const index = this.getChildIndex(color, midR, midG, midB);
            if (!node.children[index]) {
                node.children[index] = new OctreeNode(level + 1);
            }
            node = node.children[index]!;
            level++;
        }
    }

    /**
     * 获取子节点索引
     */
    private getChildIndex(color: RGBColor, midR: number, midG: number, midB: number): number {
        let index = 0;
        if (color.r > midR) index |= 1;
        if (color.g > midG) index |= 2;
        if (color.b > midB) index |= 4;
        return index;
    }

    /**
     * 减少颜色数量
     */
    private reduceColors(): void {
        let leafCount = this.countLeaves(this.root);

        while (leafCount > this.maxColors) {
            const nodeToMerge = this.findNodeToMerge(this.root);
            if (nodeToMerge) {
                this.mergeNode(nodeToMerge);
                leafCount = this.countLeaves(this.root);
            } else {
                break;
            }
        }

        // 确保至少有8个颜色
        if (leafCount < 8) {
            // 如果叶子节点太少，强制分裂一些节点
            this.ensureMinimumColors(8);
        }
    }

    /**
     * 确保最少颜色数量
     */
    private ensureMinimumColors(minColors: number): void {
        let leafCount = this.countLeaves(this.root);

        while (leafCount < minColors) {
            // 找到最大的叶子节点进行分裂
            const largestLeaf = this.findLargestLeaf(this.root);
            if (largestLeaf && largestLeaf.colors.length > 1) {
                largestLeaf.split();
                leafCount = this.countLeaves(this.root);
            } else {
                // 如果无法分裂，创建一些虚拟颜色
                this.createVirtualColors(minColors - leafCount);
                break;
            }
        }
    }

    /**
     * 找到最大的叶子节点
     */
    private findLargestLeaf(node: OctreeNode): OctreeNode | null {
        if (node.isLeaf) {
            return node.colors.length > 1 ? node : null;
        }

        let largestLeaf: OctreeNode | null = null;
        let maxColors = 0;

        for (const child of node.children) {
            if (child) {
                const leaf = this.findLargestLeaf(child);
                if (leaf && leaf.colors.length > maxColors) {
                    largestLeaf = leaf;
                    maxColors = leaf.colors.length;
                }
            }
        }

        return largestLeaf;
    }

    /**
     * 创建虚拟颜色以确保最少数量
     */
    private createVirtualColors(count: number): void {
        // 基于现有颜色创建一些虚拟颜色
        const existingColors = this.generatePalette();

        for (let i = 0; i < count; i++) {
            const baseColor = existingColors[i % existingColors.length];
            const virtualColor: RGBColor = {
                r: Math.max(0, Math.min(255, baseColor.r + (i * 30) % 100)),
                g: Math.max(0, Math.min(255, baseColor.g + (i * 40) % 100)),
                b: Math.max(0, Math.min(255, baseColor.b + (i * 50) % 100)),
                count: 1
            };

            // 添加到根节点
            this.root.addColor(virtualColor);
        }
    }

    /**
     * 计算叶子节点数量
     */
    private countLeaves(node: OctreeNode): number {
        if (node.isLeaf) return 1;
        return node.children.reduce((sum, child) => sum + (child ? this.countLeaves(child) : 0), 0);
    }

    /**
     * 找到要合并的节点
     */
    private findNodeToMerge(node: OctreeNode): OctreeNode | null {
        if (node.isLeaf) return null;

        let bestNode: OctreeNode | null = null;
        let minCount = Infinity;

        for (const child of node.children) {
            if (child && child.isLeaf) {
                if (child.colors.length < minCount) {
                    minCount = child.colors.length;
                    bestNode = child;
                }
            }
        }

        return bestNode;
    }

    /**
     * 合并节点
     */
    private mergeNode(node: OctreeNode): void {
        // 将节点的颜色合并到父节点
        const parent = this.findParent(this.root, node);
        if (parent) {
            for (const color of node.colors) {
                parent.addColor(color);
            }
            // 移除子节点
            const index = parent.children.indexOf(node);
            if (index !== -1) {
                parent.children[index] = null;
            }
        }
    }

    /**
     * 查找父节点
     */
    private findParent(root: OctreeNode, target: OctreeNode): OctreeNode | null {
        for (const child of root.children) {
            if (child === target) return root;
            if (child && !child.isLeaf) {
                const result = this.findParent(child, target);
                if (result) return result;
            }
        }
        return null;
    }

    /**
     * 生成调色板
     */
    private generatePalette(): RGBColor[] {
        const palette: RGBColor[] = [];
        this.collectLeaves(this.root, palette);
        return palette;
    }

    /**
     * 收集叶子节点
     */
    private collectLeaves(node: OctreeNode, palette: RGBColor[]): void {
        if (node.isLeaf) {
            palette.push(node.getAverageColor());
        } else {
            for (const child of node.children) {
                if (child) {
                    this.collectLeaves(child, palette);
                }
            }
        }
    }

    /**
     * 创建颜色映射
     */
    private createColorMap(palette: RGBColor[], originalColors: Map<string, RGBColor>): Map<string, RGBColor> {
        const colorMap = new Map<string, RGBColor>();

        for (const [key, originalColor] of originalColors) {
            const quantizedColor = this.findClosestColor(originalColor, palette);
            colorMap.set(key, quantizedColor);
        }

        return colorMap;
    }

    /**
     * 找到最接近的颜色
     */
    private findClosestColor(target: RGBColor, palette: RGBColor[]): RGBColor {
        let closest = palette[0];
        let minDistance = this.colorDistance(target, closest);

        for (const color of palette) {
            const distance = this.colorDistance(target, color);
            if (distance < minDistance) {
                minDistance = distance;
                closest = color;
            }
        }

        return closest;
    }

    /**
     * 计算颜色距离
     */
    private colorDistance(color1: RGBColor, color2: RGBColor): number {
        const dr = color1.r - color2.r;
        const dg = color1.g - color2.g;
        const db = color1.b - color2.b;
        return dr * dr + dg * dg + db * db;
    }
}

/**
 * 中位切分量化算法
 */
export class MedianCutQuantizer {
    private maxColors: number;

    constructor(maxColors: number = 256) {
        this.maxColors = maxColors;
    }

    /**
     * 量化图像
     */
    quantize(imageData: ImageData): QuantizationResult {
        // 统计颜色
        const colorMap = new Map<string, RGBColor>();
        const { data, width, height } = imageData;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const key = `${r},${g},${b}`;

            if (colorMap.has(key)) {
                colorMap.get(key)!.count++;
            } else {
                colorMap.set(key, { r, g, b, count: 1 });
            }
        }

        const colors = Array.from(colorMap.values());
        const palette = this.medianCut(colors, this.maxColors);
        const resultColorMap = this.createColorMap(palette, colorMap);

        return {
            palette,
            colorMap: resultColorMap,
            totalColors: palette.length,
            originalColors: colorMap.size
        };
    }

    /**
     * 中位切分算法
     */
    private medianCut(colors: RGBColor[], maxColors: number): RGBColor[] {
        if (colors.length <= maxColors) {
            return colors.map(color => ({ ...color }));
        }

        const buckets: RGBColor[][] = [colors];
        const palette: RGBColor[] = [];

        while (buckets.length < maxColors && buckets.some(bucket => bucket.length > 1)) {
            const bucketIndex = this.findLargestBucket(buckets);
            const bucket = buckets[bucketIndex];

            const [bucket1, bucket2] = this.splitBucket(bucket);

            buckets[bucketIndex] = bucket1;
            buckets.push(bucket2);
        }

        // 计算每个桶的平均颜色
        for (const bucket of buckets) {
            if (bucket.length > 0) {
                palette.push(this.getAverageColor(bucket));
            }
        }

        return palette;
    }

    /**
     * 找到最大的桶
     */
    private findLargestBucket(buckets: RGBColor[][]): number {
        let maxIndex = 0;
        let maxSize = buckets[0].length;

        for (let i = 1; i < buckets.length; i++) {
            if (buckets[i].length > maxSize) {
                maxSize = buckets[i].length;
                maxIndex = i;
            }
        }

        return maxIndex;
    }

    /**
     * 分割桶
     */
    private splitBucket(bucket: RGBColor[]): [RGBColor[], RGBColor[]] {
        // 找到颜色范围最大的通道
        const ranges = this.getColorRanges(bucket);
        const maxRange = Math.max(ranges.r, ranges.g, ranges.b);

        let sortChannel: 'r' | 'g' | 'b';
        if (maxRange === ranges.r) sortChannel = 'r';
        else if (maxRange === ranges.g) sortChannel = 'g';
        else sortChannel = 'b';

        // 按该通道排序
        bucket.sort((a, b) => a[sortChannel] - b[sortChannel]);

        // 中位切分
        const mid = Math.floor(bucket.length / 2);
        return [bucket.slice(0, mid), bucket.slice(mid)];
    }

    /**
     * 获取颜色范围
     */
    private getColorRanges(colors: RGBColor[]): { r: number; g: number; b: number } {
        const minR = Math.min(...colors.map(c => c.r));
        const maxR = Math.max(...colors.map(c => c.r));
        const minG = Math.min(...colors.map(c => c.g));
        const maxG = Math.max(...colors.map(c => c.g));
        const minB = Math.min(...colors.map(c => c.b));
        const maxB = Math.max(...colors.map(c => c.b));

        return {
            r: maxR - minR,
            g: maxG - minG,
            b: maxB - minB
        };
    }

    /**
     * 计算平均颜色
     */
    private getAverageColor(colors: RGBColor[]): RGBColor {
        const totalCount = colors.reduce((sum, c) => sum + c.count, 0);
        const avgR = colors.reduce((sum, c) => sum + c.r * c.count, 0) / totalCount;
        const avgG = colors.reduce((sum, c) => sum + c.g * c.count, 0) / totalCount;
        const avgB = colors.reduce((sum, c) => sum + c.b * c.count, 0) / totalCount;

        return {
            r: Math.round(avgR),
            g: Math.round(avgG),
            b: Math.round(avgB),
            count: totalCount
        };
    }

    /**
     * 创建颜色映射
     */
    private createColorMap(palette: RGBColor[], originalColors: Map<string, RGBColor>): Map<string, RGBColor> {
        const colorMap = new Map<string, RGBColor>();

        for (const [key, originalColor] of originalColors) {
            const quantizedColor = this.findClosestColor(originalColor, palette);
            colorMap.set(key, quantizedColor);
        }

        return colorMap;
    }

    /**
     * 找到最接近的颜色
     */
    private findClosestColor(target: RGBColor, palette: RGBColor[]): RGBColor {
        let closest = palette[0];
        let minDistance = this.colorDistance(target, closest);

        for (const color of palette) {
            const distance = this.colorDistance(target, color);
            if (distance < minDistance) {
                minDistance = distance;
                closest = color;
            }
        }

        return closest;
    }

    /**
     * 计算颜色距离
     */
    private colorDistance(color1: RGBColor, color2: RGBColor): number {
        const dr = color1.r - color2.r;
        const dg = color1.g - color2.g;
        const db = color1.b - color2.b;
        return dr * dr + dg * dg + db * db;
    }
}
