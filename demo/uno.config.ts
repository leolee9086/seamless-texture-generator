import {
    defineConfig,
    presetUno,
    presetAttributify,
    presetIcons,
    transformerDirectives,
    transformerVariantGroup,
} from 'unocss'

export default defineConfig({
    presets: [
        presetUno(),
        presetAttributify(),
        presetIcons({
            scale: 1.2,
            warn: true,
            cdn: false, // 使用本地图标集，避免网络请求
            collections: {
                // 明确引用 carbon 图标集
                carbon: () => import('@iconify-json/carbon/icons.json').then(i => i.default),
                // 自定义图标集
                custom: {
                    clarity:
                        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="11"/><path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/></svg>',
                    hsl:
                        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v2M12 20v2M8 12h8M16 12h8M2 8l4-4M18 8l-4 4M2 16l4-4M18 16l-4 4M6 12a6 6 0 1 0 6-6z"/></svg>',
                },
            }})
            
            
    ],
    safelist: [
        // 强制包含这些图标类，因为它们是动态绑定的
        'i-carbon-favorite',
        'i-carbon-image-search',
        'i-carbon-crop',
        'i-carbon-color-palette',
        'i-carbon-sun',
        'i-carbon-fog',
        'i-carbon-contrast',
        'i-custom:clarity',
        'i-custom:hsl',
        'i-carbon-settings-adjust',
        'i-carbon-view',
        'i-carbon-save',

    ],
    transformers: [
        transformerDirectives(),
        transformerVariantGroup(),
    ],
    theme: {
        colors: {
            glass: {
                100: 'rgba(255, 255, 255, 0.1)',
                200: 'rgba(255, 255, 255, 0.2)',
                300: 'rgba(255, 255, 255, 0.3)',
                400: 'rgba(255, 255, 255, 0.4)',
                500: 'rgba(255, 255, 255, 0.5)',
                600: 'rgba(255, 255, 255, 0.6)',
                700: 'rgba(255, 255, 255, 0.7)',
                800: 'rgba(255, 255, 255, 0.8)',
            },
            darkglass: {
                100: 'rgba(0, 0, 0, 0.1)',
                200: 'rgba(0, 0, 0, 0.2)',
                300: 'rgba(0, 0, 0, 0.3)',
                400: 'rgba(0, 0, 0, 0.4)',
                500: 'rgba(0, 0, 0, 0.5)',
                600: 'rgba(0, 0, 0, 0.6)',
                700: 'rgba(0, 0, 0, 0.7)',
                800: 'rgba(0, 0, 0, 0.8)',
            }
        },
        boxShadow: {
            'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            'glass-sm': '0 4px 16px 0 rgba(31, 38, 135, 0.2)',
            'glass-inset': 'inset 0 0 16px 0 rgba(255, 255, 255, 0.1)',
            'neon': '0 0 10px rgba(0, 255, 255, 0.5), 0 0 20px rgba(0, 255, 255, 0.3)',
        }
    },
    shortcuts: [
        ['flex-center', 'flex justify-center items-center'],
        ['flex-col-center', 'flex flex-col justify-center items-center'],
        ['glass-panel', 'bg-glass-100 backdrop-blur-xl border border-glass-200 shadow-glass rounded-3xl'],
        ['glass-btn', 'px-4 py-2 rounded-xl bg-glass-200 hover:bg-glass-300 active:bg-glass-400 transition-all duration-300 backdrop-blur-md border border-glass-100 shadow-glass-sm text-white font-medium'],
        ['glass-input', 'bg-darkglass-200 border border-glass-100 rounded-xl px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-md transition-all'],
        ['icon-btn', 'p-2 rounded-full hover:bg-glass-200 transition-colors cursor-pointer'],
        ['mobile-container', 'max-w-md mx-auto h-dvh overflow-hidden bg-gradient-to-br from-gray-900 to-black text-white font-sans relative'],
        ['scrollbar-hide', 'overflow-auto scrollbar-hide'],
    ]
})
