/// &lt;reference types="vite/client" /&gt;

// 声明 WGSL shader 文件的导入类型
declare module '*.wgsl?raw' {
    const content: string;
    export default content;
}

declare module '*.wgsl' {
    const content: string;
    export default content;
}
