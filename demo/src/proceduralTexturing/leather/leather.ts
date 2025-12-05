
/**
 * AdvancedLeatherParams Interface
 * Professional procedural leather generation parameters.
 */
export interface LeatherParams {
    tileSize: number;

    // --- Grain Pattern (The "Scales") ---
    cellScale: number;          // Size of the sales (5.0-30.0)
    cellRandomness: number;     // 0=Grid-like (Reptile), 1=Organic (Cow)
    cellStretch: number;        // Anisotropy (0.0-1.0), elongates cells
    cellStretchAngle: number;   // Direction of stretch (radians)

    // --- Boundaries (The "Grooves") ---
    grooveWidth: number;        // Width between scales
    grooveDepth: number;        // Sharpness of depth
    grooveProfile: number;      // 0=V-shape (Sharp), 1=U-shape (Soft)

    // --- Surface Micro-Detail ---
    wrinkleScale: number;       // Fine wrinkles across cells
    wrinkleIntensity: number;
    poreDensity: number;        // Hair follicle pores
    poreDepth: number;          // Pores are typically concave holes
    poreVisibility: number;     // 0-1

    // --- Imperfections & Aging ---
    creaseIntensity: number;    // Large fold lines
    creaseFrequency: number;
    wearLevel: number;          // 0 = New, 1 = Very Distressed
    scratchCount: number;       // Number of random scratches
    scratchIntensity: number;

    // --- Material Response ---
    roughnessMin: number;       // Base roughness (smooth parts)
    roughnessMax: number;       // Roughness in grooves/pores
    normalStrength: number;     // Global normal intensity

    // --- Color ---
    gradientStops: { offset: number, color: string }[];
    patinaStrength: number;     // Darkening in grooves
    colorVariation: number;     // Per-cell color shift
}

export const leatherShaderWGSL = /* wgsl */`

struct Uniforms {
    viewMatrix : mat4x4<f32>, // Unused but required for compatibility
    
    tileSize : f32,
    cellScale : f32,
    cellRandomness : f32,
    cellStretch : f32,
    cellStretchAngle : f32,
    
    grooveWidth : f32,
    grooveDepth : f32,
    grooveProfile : f32,
    
    wrinkleScale : f32,
    wrinkleIntensity : f32,
    poreDensity : f32,
    poreDepth : f32,
    poreVisibility : f32,
    
    creaseIntensity : f32,
    creaseFrequency : f32,
    wearLevel : f32,
    scratchCount : f32,
    scratchIntensity : f32,
    
    roughnessMin : f32,
    roughnessMax : f32,
    normalStrength : f32,
    
    patinaStrength : f32,
    colorVariation : f32,
    
    // Padding to ensure 16-byte alignment if needed, 
    // but we will carefully pack in the generator.
    padding1 : f32,
    padding2 : f32,
};

@group(0) @binding(0) var<uniform> u : Uniforms;
@group(0) @binding(1) var gradientTexture : texture_2d<f32>;
@group(0) @binding(2) var gradientSampler : sampler;

struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) uv : vec2<f32>,
};

// --- Utilities ---

fn hash2(p: vec2<f32>) -> vec2<f32> {
    var h = vec2<f32>(dot(p, vec2<f32>(127.1, 311.7)),
                      dot(p, vec2<f32>(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(h) * 43758.5453123);
}

// Seamless Periodic Hash
fn hash2_periodic(p: vec2<f32>, period: vec2<f32>) -> vec2<f32> {
    let wrappedP = p % period;
    var h = vec2<f32>(dot(wrappedP, vec2<f32>(127.1, 311.7)),
                      dot(wrappedP, vec2<f32>(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(h) * 43758.5453123);
}

// Pseudo-random value 0-1
fn rand2_periodic(p: vec2<f32>, period: vec2<f32>) -> f32 {
    let wrappedP = p % period;
    return fract(sin(dot(wrappedP, vec2<f32>(12.9898, 78.233))) * 43758.5453);
}

// --- Gradient Noise for seamless Micro-Details ---
fn periodicNoise(p: vec2<f32>, period: f32) -> f32 {
    let p_vec = vec2<f32>(period);
    let i = floor(p);
    let f = fract(p);
    let t = f * f * (3.0 - 2.0 * f);

    let v00 = dot(hash2_periodic(i + vec2<f32>(0.0,0.0), p_vec), f - vec2<f32>(0.0,0.0));
    let v10 = dot(hash2_periodic(i + vec2<f32>(1.0,0.0), p_vec), f - vec2<f32>(1.0,0.0));
    let v01 = dot(hash2_periodic(i + vec2<f32>(0.0,1.0), p_vec), f - vec2<f32>(0.0,1.0));
    let v11 = dot(hash2_periodic(i + vec2<f32>(1.0,1.0), p_vec), f - vec2<f32>(1.0,1.0));

    return mix(mix(v00, v10, t.x), mix(v01, v11, t.x), t.y);
}

fn periodicFbm(p: vec2<f32>, octaves: i32, period: f32) -> f32 {
    var value = 0.0;
    var amplitude = 0.5;
    var currentPeriod = period;
    var pos = p;
    
    for (var i = 0; i < 5; i++) {
        if (i >= octaves) { break; }
        value = value + periodicNoise(pos, currentPeriod) * amplitude;
        pos = pos * 2.0;
        currentPeriod = currentPeriod * 2.0;
        amplitude = amplitude * 0.5;
    }
    return value;
}

// --- Advanced Voronoi ---
// Returns:
// x: Distance to closest center (F1)
// y: Distance to second closest center (F2)
// z: Hash/ID of the closest cell (0-1)
fn voronoi_advanced(p: vec2<f32>, period: f32, randomness: f32) -> vec3<f32> {
    let ip = floor(p);
    let fp = fract(p);
    
    var d1 = 8.0;
    var d2 = 8.0;
    var cellID = 0.0;
    
    // Check 3x3 neighbor cells
    for(var j=-1; j<=1; j++) {
        for(var i=-1; i<=1; i++) {
            let neighbor = vec2<f32>(f32(i), f32(j));
            
            // Random point in neighbor cell
            // We must use periodic hash for position to ensure tiling
            let rnd = hash2_periodic(ip + neighbor, vec2<f32>(period));
            
            // Jitter position based on randomness param
            // if randomness is 0, point is at center (0.5), if 1, point is anywhere
            let pointPos = neighbor + 0.5 + rnd * 0.5 * randomness;
            
            let dist = length(pointPos - fp); // Euclidean distance
            
            if(dist < d1) {
                d2 = d1;
                d1 = dist;
                // Store cell ID for color variation
                cellID = rand2_periodic(ip + neighbor, vec2<f32>(period));
            } else if(dist < d2) {
                d2 = dist;
            }
        }
    }
    return vec3<f32>(d1, d2, cellID);
}

// Rotates UV coordinates
fn rotateUV(uv: vec2<f32>, angle: f32) -> vec2<f32> {
    let s = sin(angle);
    let c = cos(angle);
    return vec2<f32>(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
}

// -----------------------------------------------------------
// Core Logic: Leather Generation
// -----------------------------------------------------------

fn getLeatherDetail(uv: vec2<f32>) -> vec4<f32> {
    let scale = u.tileSize;
    var pos = uv * scale;
    
    // 1. Domain Warping for Organic Feel
    // Leather cells are never perfectly straight grid.
    let warpFreq = 3.0; // Fixed large scale warping
    let warp = vec2<f32>(
        periodicNoise(pos * warpFreq, scale * warpFreq),
        periodicNoise(pos * warpFreq + 5.2, scale * warpFreq)
    ) * 0.1; // Strength of warp
    
    var grainPos = pos + warp;
    
    // 2. Anisotropy / Stretch
    // Rotate, then stretch one axis
    if (abs(u.cellStretch) > 0.01) {
        let center = vec2<f32>(scale * 0.5);
        // Relative to center for rotation? Actually texture space is infinite periodic.
        // Just rotate the coords.
        let rotPos = rotateUV(grainPos, u.cellStretchAngle);
        // Stretch: multiply one axis to make cells appear longer in that direction
        // Effectively, we scale coordinates DOWN in one axis, so freq decreases, shapes get larger/longer.
        grainPos = vec2<f32>(rotPos.x * (1.0 - u.cellStretch * 0.5), rotPos.y);
    }

    // 3. Voronoi Grain (Scales)
    // Scale is driven by cellScale
    let vScale = u.cellScale;
    let vData = voronoi_advanced(grainPos * vScale, scale * vScale, u.cellRandomness);
    let f1 = vData.x;
    let f2 = vData.y;
    let cellID = vData.z;
    
    // 4. Groove Calculation
    // Grooves are at the boundaries where f1 approx f2
    // Border distance = f2 - f1
    let borderDist = f2 - f1;
    
    // Create groove profile
    // sharp V-shape or softer U-shape
    let grooveSoftness = mix(0.01, 0.2, u.grooveProfile);
    let groove = smoothstep(u.grooveWidth * 0.5, u.grooveWidth * 0.5 + grooveSoftness, borderDist);
    
    // Cell height (pillow effect)
    // Cells are higher in the center (f1 close to 0) and lower at edges
    // But leather scales are usually flat-topped
    let cellHeight = smoothstep(0.0, 0.5, borderDist); 
    
    // 5. Micro-Detail (Papillary Grain)
    // High frequency noise on top of scales
    let microNoise = periodicFbm(pos * u.wrinkleScale, 3, scale * u.wrinkleScale);
    let microDetail = microNoise * u.wrinkleIntensity * 0.2;
    
    // 6. Pores
    // Typically periodic dots.
    // Use high freq Worley or just Thresholded noise?
    let poreFreq = u.poreDensity * 5.0;
    let poreNoise = periodicNoise(pos * poreFreq, scale * poreFreq);
    let poreMask = smoothstep(0.4, 0.45, poreNoise - (1.0 - u.poreVisibility)*0.5);
    // Pores are holes, so we subtract height
    let poreIndent = poreMask * u.poreDepth;
    
    // 7. Larger Creases / Folds
    let creaseNoise = periodicFbm(pos * u.creaseFrequency, 2, scale * u.creaseFrequency);
    // Ridge noise for sharp creases
    let creaseVal = 1.0 - abs(creaseNoise); 
    // Threshold to verify sparse creases
    let creaseLine = smoothstep(0.7, 0.8, creaseVal) * u.creaseIntensity;
    
    // 8. Combine Height / Density
    // Base is the groove pattern
    var h = 1.0;
    // Apply Grooves (darker/deeper)
    h = h * groove; 
    // Apply Pores
    h = h - poreIndent;
    // Apply Microdetail (additve/subtractive)
    h = h + microDetail;
    // Apply Creases
    h = h - creaseLine;
    
    h = clamp(h, 0.0, 1.0);
    
    // 9. Wear / Aging Logic
    // Wear happens on high spots (h > 0.8 say)
    // Dirt accumulates in low spots (h < 0.2)
    
    // 'Patina' Mask (Low spots)
    let patinaMask = 1.0 - smoothstep(0.0, 0.5, h);
    
    // 'Rub' Mask (High spots)
    let rubMask = smoothstep(0.7, 1.0, h) * u.wearLevel;
    
    // --- Return Data ---
    // x: Final Density (Color lookup)
    // y: Height (Normal map gen)
    // z: Roughness Mix (0=Smooth/Rubbed, 1=Rough/Groove)
    // w: Cell ID (for color variation)
    
    // Density maps to gradient.
    // Base is h.
    // Patina makes it darker (density -> 0 for dark wood? No, check gradient stops).
    // Usually gradient 0 is dark/recessed, 1 is light/raised.
    var density = h;
    
    // Add per-cell variation to density so different scales pick slightly different colors
    density = density + (cellID - 0.5) * u.colorVariation;
    
    // Apply Patina (darken low spots further or shift towards dark end)
    density = density - patinaMask * u.patinaStrength * 0.5;
    
    // Apply Rub (lighten high spots?) 
    // Assuming light color is at 1.0.
    density = density + rubMask * 0.3;
    
    density = clamp(density, 0.0, 1.0);
    
    // Roughness logic
    // Grooves/Pores are rougher (1.0)
    // High spots are smoother (0.0), especially if worn
    let roughnessMix = 1.0 - h; // Low h = High roughness mix
    // Modify by wear: rubbed areas are even smoother
    let finalRoughnessLogic = roughnessMix - rubMask * 0.5;
    
    return vec4<f32>(density, h, clamp(finalRoughnessLogic, 0.0, 1.0), cellID);
}

@vertex
fn vs_main(@location(0) position : vec3<f32>, @location(1) uv : vec2<f32>) -> VertexOutput {
    var output : VertexOutput;
    output.Position = vec4<f32>(position, 1.0);
    output.uv = uv;
    return output;
}

@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4<f32> {
    let data = getLeatherDetail(in.uv);
    let density = data.x;
    let height = data.y;
    let roughnessMix = data.z;
    let cellID = data.w;
    
    // 1. Color Lookup
    let albedo = textureSample(gradientTexture, gradientSampler, vec2<f32>(density, 0.5)).rgb;
    
    // 2. Normal Map Calculation
    // Use derivatives of height
    // Note: Height is purely procedural 0-1.
    // Needs scaling by normalStrength.
    let dHdUV = vec2<f32>(dpdx(height), dpdy(height));
    let normal = normalize(vec3<f32>(-dHdUV.x * u.normalStrength, -dHdUV.y * u.normalStrength, 1.0));
    
    // 3. Roughness
    let roughness = mix(u.roughnessMin, u.roughnessMax, roughnessMix);
    
    // 4. Simple Lighting (Preview)
    let lightDir = normalize(vec3<f32>(0.5, 0.5, 1.0));
    let diff = max(dot(normal, lightDir), 0.0);
    
    let viewDir = vec3<f32>(0.0, 0.0, 1.0);
    let halfDir = normalize(lightDir + viewDir);
    let spec = pow(max(dot(normal, halfDir), 0.0), 32.0 * (1.0 - roughness));
    
    // Add slight environment sheen (faked)
    let sheen = (1.0 - roughness) * 0.2;
    
    let finalColor = albedo * (0.3 + 0.7 * diff) + vec3<f32>(spec + sheen);
    
    return vec4<f32>(finalColor, 1.0);
}
`
