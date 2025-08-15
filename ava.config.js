export default {
  files: ['src/test/unit-ava/**/*.test.js'],
  require: ['@babel/register'],
  babel: {
    testOptions: {
      presets: ['@babel/preset-env', '@babel/preset-react']
    }
  },
  timeout: '2m',
  verbose: true,
  reporter: ['spec', 'junit'],
  outputDir: 'reports/ava'
}
