const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const postcssPresetEnv = require('postcss-preset-env');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  devtool: 'eval-source-map',
  devServer: {
    contentBase: './dist',
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new CleanWebpackPlugin(['dist']),
    new HtmlWebpackPlugin({
      template: 'src/index.html',
    }),
  ],
  module: {
    rules: [
      {
        test: require.resolve('snapsvg/dist/snap.svg.js'),
        use: 'imports-loader?this=>window,fix=>module.exports=0',
      },
      {
        enforce: 'pre',
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'eslint-loader',
      },
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          { loader: 'css-loader', options: { importLoaders: 1 } },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: () => [
                postcssPresetEnv(/* pluginOptions */)
              ],
            }
          },
        ],
      },
    ]
  },
  resolve: {
    alias: {
      snapsvg: 'snapsvg/dist/snap.svg.js',
    }
  }
};
