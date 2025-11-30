@group(0) @binding(0) var<storage, read_write> channelValues: array<f32>;
@group(0) @binding(1) var<storage, read_write> channelPixelOffsets: array<u32>;
@group(0) @binding(2) var<uniform> params: Params;

struct Params {
    k: u32,
    j: u32,
    element_count: u32,
    total_invocations: u32,
    channel_count: u32,
};

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let thread_index = global_id.x;
    let element_count = params.element_count;
    let k = params.k;
    let j = params.j;
    let total_invocations = params.total_invocations;
    let channel_count = params.channel_count;

    for (var i = thread_index; i < element_count; i = i + total_invocations) {
        let ix = i;
        let jx = ix ^ j;
        
        if (jx >= element_count || jx < ix) {
            continue;
        }
        
        let direction = ((ix & k) == 0u);
        
        // 为每个通道执行排序
        for (var channel = 0u; channel < channel_count; channel = channel + 1u) {
            let val_i = channelValues[ix * channel_count + channel];
            let val_j = channelValues[jx * channel_count + channel];
            
            if (direction == (val_i > val_j)) {
                // 交换值
                let temp_val = channelValues[ix * channel_count + channel];
                channelValues[ix * channel_count + channel] = channelValues[jx * channel_count + channel];
                channelValues[jx * channel_count + channel] = temp_val;

                // 交换偏移
                let temp_offset = channelPixelOffsets[ix * channel_count + channel];
                channelPixelOffsets[ix * channel_count + channel] = channelPixelOffsets[jx * channel_count + channel];
                channelPixelOffsets[jx * channel_count + channel] = temp_offset;
            }
        }
    }
}