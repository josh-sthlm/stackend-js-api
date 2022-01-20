const { NODE_ENV } = process.env;

module.exports = {
  presets: [
    '@babel/typescript',
    [
      '@babel/env',
      {
        targets: {
          browsers: ['ie >= 11']
        },
        exclude: ['transform-async-to-generator', 'transform-regenerator'],
        modules: false,
        loose: true,
        useBuiltIns: 'usage',
        corejs: 3
      }
    ]
  ],
  plugins: [
    // don't use `loose` mode here - need to copy symbols when spreading
    '@babel/proposal-object-rest-spread',
    '@babel/plugin-proposal-class-properties',
    ['@babel/plugin-proposal-private-methods', { loose: false }],
    NODE_ENV === 'test' && '@babel/transform-modules-commonjs'
  ].filter(Boolean)
};
