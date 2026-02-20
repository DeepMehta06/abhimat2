/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
            colors: {
                'saffron': '#FF9933',
                'india-green': '#138808',
                'ashoka-blue': '#000080',
                'accent': '#FFD700',
                'alert-red': '#dc2626',
                'neutral-dark': '#1d140c',
                'background-light': '#f8f7f5',
            },
            fontFamily: {
                display: ['Inter', 'Plus Jakarta Sans', 'sans-serif'],
            },
            animation: {
                'spin-slow': 'spin-slow 8s linear infinite',
                'wave-gradient': 'wave-gradient 3s linear infinite',
            },
            keyframes: {
                'spin-slow': {
                    from: { transform: 'rotate(0deg)' },
                    to: { transform: 'rotate(360deg)' },
                },
                'wave-gradient': {
                    '0%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                    '100%': { backgroundPosition: '0% 50%' },
                },
            },
            boxShadow: {
                soft: '0 4px 20px -2px rgba(0,0,0,0.05)',
            },
        },
    },
    plugins: [],
};
