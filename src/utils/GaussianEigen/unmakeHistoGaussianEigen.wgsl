// --- 缓冲区与参数定义 ---
@group(0) @binding(0) var<storage, read> target_pixels: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read> input_pixels: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read_write> projected_values: array<f32>;
@group(0) @binding(3) var<storage, read_write> output_pixels: array<vec4<f32>>;
@group(0) @binding(4) var<uniform> eigen_vectors: mat3x3<f32>;
@group(0) @binding(5) var<uniform> params: Params;

struct Params {
    operation: u32,
    k: u32,
    j: u32,
    padded_element_count: u32,
    total_invocations: u32,
    input_element_count: u32,
    target_element_count: u32,
};


// --- 逻辑实现 ---

fn do_projection(global_id: vec3<u32>) {
    // 遍历整个填充后的区域
    if (global_id.x >= params.padded_element_count) {
        return;
    }
    let pixel_index = global_id.x;
    let out_index = pixel_index * 3u;

    if (pixel_index < params.target_element_count) {
        let pixel_rgb = target_pixels[pixel_index].rgb;
        // 由于eigen_vectors是CPU端eigenVectors的转置，我们需要按列访问来获取原始的行
        // CPU: dot(pixel_rgb, eigenVectors[row])
        // GPU: dot(pixel_rgb, vec3(eigen_vectors[0][row], eigen_vectors[1][row], eigen_vectors[2][row]))
        let projected_r = dot(pixel_rgb, vec3(eigen_vectors[0][0], eigen_vectors[1][0], eigen_vectors[2][0]));
        let projected_g = dot(pixel_rgb, vec3(eigen_vectors[0][1], eigen_vectors[1][1], eigen_vectors[2][1]));
        let projected_b = dot(pixel_rgb, vec3(eigen_vectors[0][2], eigen_vectors[1][2], eigen_vectors[2][2]));
        projected_values[out_index] = projected_r;
        projected_values[out_index + 1u] = projected_g;
        projected_values[out_index + 2u] = projected_b;
    } else {
        // 对填充区域写入极大值，使其在排序后排到末尾
        let infinity = 3.402823466e+38; // f32 max
        projected_values[out_index] = infinity;
        projected_values[out_index + 1u] = infinity;
        projected_values[out_index + 2u] = infinity;
    }
}

fn do_sort(global_id: vec3<u32>) {
    let thread_index = global_id.x;
    for (var i = thread_index; i < params.padded_element_count; i = i + params.total_invocations) {
        let ix = i;
        let jx = ix ^ params.j;

        if (jx < ix) { continue; }

        let direction = ((ix & params.k) == 0u);
        let ix3 = ix * 3u;
        let jx3 = jx * 3u;

        // R 通道
        if (direction == (projected_values[ix3] > projected_values[jx3])) {
            let temp = projected_values[ix3];
            projected_values[ix3] = projected_values[jx3];
            projected_values[jx3] = temp;
        }
        // G 通道
        if (direction == (projected_values[ix3 + 1u] > projected_values[jx3 + 1u])) {
            let temp = projected_values[ix3 + 1u];
            projected_values[ix3 + 1u] = projected_values[jx3 + 1u];
            projected_values[jx3 + 1u] = temp;
        }
        // B 通道
        if (direction == (projected_values[ix3 + 2u] > projected_values[jx3 + 2u])) {
            let temp = projected_values[ix3 + 2u];
            projected_values[ix3 + 2u] = projected_values[jx3 + 2u];
            projected_values[jx3 + 2u] = temp;
        }
    }
}

fn erf(x: f32) -> f32 {
    let a1 = 0.254829592; let a2 = -0.284496736; let a3 = 1.421413741;
    let a4 = -1.453152027; let a5 = 1.061405429; let p = 0.3275911;
    let sign = select(1.0, -1.0, x < 0.0);
    let abs_x = abs(x);
    let t = 1.0 / (1.0 + p * abs_x);
    let y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * exp(-abs_x * abs_x);
    return sign * y;
}

fn mapValue(value: f32, channel_offset: u32) -> f32 {
    // 查找范围应该是原始、未填充的数据长度
    // 注意：与CPU实现保持一致，所有通道都使用R通道的长度来计算index
    let target_size = params.target_element_count;
    let U = 0.5 + 0.5 * erf(value / sqrt(2.0));
    let index = u32(floor(U * f32(target_size)));
    let clamped_index = min(index, target_size - 1u);
    return projected_values[clamped_index * 3u + channel_offset];
}

fn do_mapping(global_id: vec3<u32>) {
    let pixel_index = global_id.x;
    let input_rgb = input_pixels[pixel_index].rgb;

    let mapped_r = mapValue(input_rgb.r, 0u);
    let mapped_g = mapValue(input_rgb.g, 1u);
    let mapped_b = mapValue(input_rgb.b, 2u);

    // 将矩阵乘法展开为显式的点积计算，以与CPU实现保持完全一致
    // 由于eigen_vectors是CPU端eigenVectors的转置，即evT
    // CPU: dot(mapped_rgb, evT[row])
    // GPU: dot(mapped_rgb, eigen_vectors[row].xyz)
    let final_r = dot(vec3<f32>(mapped_r, mapped_g, mapped_b), eigen_vectors[0].xyz);
    let final_g = dot(vec3<f32>(mapped_r, mapped_g, mapped_b), eigen_vectors[1].xyz);
    let final_b = dot(vec3<f32>(mapped_r, mapped_g, mapped_b), eigen_vectors[2].xyz);
    let final_rgb = vec3<f32>(final_r, final_g, final_b);

    output_pixels[pixel_index] = vec4<f32>(final_rgb, input_pixels[pixel_index].a);
}


// --- 主入口点 ---
@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let operation = params.operation;

    if (operation == 0u) {
        do_projection(global_id);
    } else if (operation == 1u) {
        do_sort(global_id);
    } else if (operation == 2u) {
        do_mapping(global_id);
    }
}