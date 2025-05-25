module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        projectService: true,
        tsconfigRootDir: __dirname,
    },
    ignorePatterns: ['node_modules/', 'dist', '.eslintrc.js'],
    extends: [
        'expo',
        'prettier',
        'plugin:@typescript-eslint/recommended-type-checked',
        'plugin:prettier/recommended',
    ],
    plugins: ['prettier', '@typescript-eslint'],
    rules: {
        'prettier/prettier': 'error',
        '@typescript-eslint/no-require-imports': 'off',
        '@typescript-eslint/no-unused-vars': 'warn',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unsafe-enum-comparison': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        'react/jsx-no-literals': ['error', { 'noStrings': true, 'allowedStrings': [] }]
    },
    "overrides": [
        {
            "files": ["*.js","*.jsx","*.tsx"],
            "rules": {
                "react/jsx-no-literals": ["error", { "ignoreProps": true, "allowedStrings": [""] }]
            }
        }
    ],
    settings: {
        react: { version: 'detect' },
        'import/resolver': {
            typescript: {
                project: './tsconfig.json',
            },
        },
    },
};
