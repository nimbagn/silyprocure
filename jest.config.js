module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.js'],
    collectCoverageFrom: [
        'backend/**/*.js',
        '!backend/server.js',
        '!backend/config/**',
        '!**/node_modules/**'
    ],
    coverageDirectory: 'coverage',
    verbose: true
};

