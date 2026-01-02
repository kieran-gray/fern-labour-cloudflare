import mantine from 'eslint-config-mantine';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    ...mantine,
    {
        ignores: [
            '**/*.{mjs,cjs,js,d.ts,d.mts}'
        ],
        rules: {
            "no-console": "off",
            "jsx-a11y/no-static-element-interactions" :"off",
            "jsx-a11y/click-events-have-key-events": "off",
            "@typescript-eslint/no-unsafe-function-type": "off",
            "no-prototype-builtins": "off"
        }
    }
);
