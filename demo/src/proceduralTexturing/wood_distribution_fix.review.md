# 木纹纹理髓射线和导管分布问题审阅

## 问题描述

当前木纹纹理过于平滑单一,主要原因是髓射线(Medullary Rays)和导管/毛孔(Pores)的分布不正常。

## 问题分析

### 1. 髓射线问题 (第173-174行)

**当前代码:**
```wgsl
let rayNoise = periodicFbm(vec3<f32>(pos.x * u.rayFrequencyX, pos.y * u.rayFrequencyY, 0.0), 2, scale * u.rayFrequencyX, u.fbmAmplitude);
let rays = smoothstep(0.6, 1.0, rayNoise) * u.rayStrength;
```

**问题:**
1. `smoothstep(0.6, 1.0, rayNoise)` 阈值太高,因为FBM噪声范围大约是`[-1, 1]`,大部分值低于0.6,导致只有极少的射线显示
2. 髓射线应该是**离散的细长条纹**,不是平滑的渐变噪声
3. 频率太低,射线太稀疏

**真实髓射线特征:**
- 细长的垂直条纹(perpendicular to growth rings)
- 随机分布但密度适中
- 在某些木材(如橡木)中非常明显,形成"虎斑"或"射线斑"效果

### 2. 导管/毛孔问题 (第179-181行)

**当前代码:**
```wgsl
let poreNoise = periodicFbm(pos * u.poreDensity, 2, scale * u.poreDensity, u.fbmAmplitude);
let pores = step(0.3, poreNoise) * ringSignal * 0.5;
```

**问题:**
1. `step(0.3, poreNoise)` 产生大面积的连续区域,而不是离散的小点
2. 孔隙应该是**随机分布的小圆点**,不是连续的噪声块
3. 缺少点状特征检测

**真实导管特征:**
- 小而密集的点状结构
- 主要分布在早材(浅色)区域
- 大小略有变化但整体均匀
- 有些木材呈环孔状(ring-porous),有些呈散孔状(diffuse-porous)

## 修复方案

### 方案A: 改进噪声阈值和频率

1. **髓射线修复:**
   - 降低阈值范围,使用`smoothstep(-0.2, 0.2, rayNoise)`捕获更多信号
   - 增加X方向频率到100-200,形成细密的条纹
   - 添加绝对值处理,让射线更锐利

2. **导管修复:**
   - 使用更高的阈值,如`smoothstep(0.7, 0.9, poreNoise)`,只保留噪声峰值作为孔点
   - 增加频率,让孔隙更密集更小
   - 降低孔隙的影响强度,从0.5改为0.1-0.2

### 方案B: 使用Voronoi噪声(更真实)

对于导管,使用Voronoi噪声可以生成更自然的点状分布:
- Voronoi cell的中心点作为导管位置
- 距离场控制孔隙大小
- 更符合植物生理学特征

### 方案C: 添加各向异性过滤

髓射线应该有方向性(垂直于年轮):
- 使用年轮梯度方向计算射线方向
- 沿垂直方向应用定向模糊或条纹噪声

## 推荐修复代码

我建议使用**方案A**(最简单有效),具体修改如下:

### 髓射线修复:
```wgsl
// 5. 髓射线 (Medullary Rays) - 改进版
// 使用绝对值和更窄的阈值来生成锐利的条纹
let rayNoiseRaw = periodicFbm(vec3<f32>(pos.x * u.rayFrequencyX, pos.y * u.rayFrequencyY, 0.0), 2, scale * u.rayFrequencyX, u.fbmAmplitude);
// 关键改进:使用abs()生成对称条纹,并降低阈值
let rayPattern = abs(rayNoiseRaw);
let rays = smoothstep(0.3, 0.5, rayPattern) * u.rayStrength;
// 射线主要在早材中可见
let raysModulated = rays * ringSignal;
```

### 导管修复:
```wgsl
// 6. 导管孔隙 (Pores) - 改进版
// 使用更高频率和更严格的阈值来生成点状结构
let poreNoise = periodicFbm(pos * u.poreDensity * 2.0, 3, scale * u.poreDensity * 2.0, u.fbmAmplitude);
// 关键改进:只保留噪声的极值作为孔点
let porePattern = smoothstep(0.85, 0.95, poreNoise);
// 孔隙主要在早材,且影响较小
let pores = porePattern * ringSignal * 0.15;
```

### 最终合成修复:
```wgsl
// --- 最终合成 ---
var finalDensity = ringSignal;
finalDensity = finalDensity - pores; // 孔隙是暗凹陷
finalDensity = finalDensity + raysModulated * 0.3; // 射线略亮,但不能太强
finalDensity = clamp(finalDensity, 0.0, 1.0);

return vec4<f32>(finalDensity, ringSignal, pores, raysModulated);
```

## 参数调整建议

修复后,还需要调整默认参数:

```typescript
rayFrequencyX: 80.0,  // 从50增加到80,让射线更密集
rayFrequencyY: 3.0,   // 从2增加到3,增加纵向变化
poreDensity: 15.0,    // 从10增加到15,让孔隙更小更密
rayStrength: 0.3,     // 从0.5降到0.3,避免射线过强
```

## 测试建议

修复后测试以下场景:
1. 橡木预设(应该有明显的射线斑)
2. 松木预设(射线应该很弱或不可见)
3. 高poreDensity值(应该看到密集的小点,不是大块)
4. 低rayStrength值(射线应该完全消失,不影响基础年轮)

## 技术注释

- FBM噪声的输出范围大约是`[-amplitude*2, amplitude*2]`,默认amplitude=0.5时范围约为`[-1, 1]`
- `smoothstep()`的正确用法应该根据输入范围调整,不能直接使用0-1范围的阈值
- 真实木材的射线和孔隙都是**高频小尺度特征**,不应该主导整体纹理

## �ڶ����޸� (2025-12-04 19:50)

### �����ⷢ��

��һ���޸���������µ�����:

1. **�����ߺ͵��ܼ����������Ľ��紦**
   - ԭ��: ʹ�� `raysModulated = rays * ringSignal` �� `pores = porePattern * ringSignal * 0.15`
   - `ringSignal` �Ǵ�0��1������ֵ,�������Ľ��紦�ݶ����
   - ���� `ringSignal` ��������ǿ�����ݶȱ仯,���ռ����ڽ��紦

2. **������ɫ�ʹ��ھ���**
   - ԭ��: ȱ�پֲ�����仯
   - ��ʵľ���в����ȵ���ɫ�ֲ�

### �ڶ����޸�����

#### 1. ʹ����ֵ�жϴ�����������

**�ؼ��Ľ�:**
- ����ɢ�� `isEarlywood = step(0.4, ringSignal)` ���������� `ringSignal`
- `isEarlywood` ��0��1����ɢֵ,�������������1,��������������0
- ����������ֵ�ݶȵ��µ�������������

**�������޸�:**
```wgsl
let isEarlywood = step(0.4, ringSignal);
let raysVisible = rays * (0.3 + isEarlywood * 0.7); // ����30%�ɼ�,���100%�ɼ�
```

**�����޸�:**
```wgsl
let pores = porePattern * isEarlywood * 0.15; // ֻ������������
```

#### 2. ���Ӿֲ���ɫ�仯

```wgsl
let colorVariation = periodicNoise(pos * 3.0, scale * 3.0) * 0.08;
var finalDensity = ringSignal + colorVariation;
```

### ����Ҫ��

1. **����ֵ vs ��ɢֵ**
   - ������ɫ���: ʹ�������� `ringSignal`
   - ���������ֲ�: ʹ����ɢ�� `isEarlywood`
   
2. **��ֵѡ��**
   - `step(0.4, ringSignal)`: 40%��Ϊ�����ķֽ�
   
3. **�����ɼ���**
   - ������: `0.3 + isEarlywood * 0.7` = ����30%,���100%
   - ����: `isEarlywood * 0.15` = ����0%,���15%

4. **��ɫ�仯����**
   - `* 0.08`: 8%����ɫ�仯
   - Ƶ�� `* 3.0`: �еȳ߶ȵı仯
