/* eslint-env node */
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const { EnvironmentPlugin } = require('webpack');

const devMode = process.env.NODE_ENV !== 'production';

module.exports = () => {
  return {
    entry: {
      bundle: './src/index.js',
    },

    output: {
      path: path.resolve(__dirname, 'public'),
      filename: 'build/[name].js',
      chunkFilename: 'build/[name].js?id=[chunkhash]',
      // publicPath: './',
    },

    resolve: {
      alias: {
        svelte: path.resolve('node_modules', 'svelte'),
      },
      extensions: ['.mjs', '.js', '.svelte'],
      mainFields: ['svelte', 'browser', 'module', 'main'],
    },

    module: {
      rules: [
        {
          test: /\.m?js$/,
          exclude: /node_modules\/(?!svelte)/,
          use: ['babel-loader'],
        },
        {
          test: /\.svelte$/,
          use: [
            'babel-loader',
            {
              loader: 'svelte-loader',
              options: {
                dev: devMode,
                hotReload: false,
                emitCss: true,
              },
            },
          ],
        },
        {
          test: /\.css$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                hmr: false,
                esModule: false,
              },
            },
            'css-loader',
          ],
        },
      ],
    },

    devServer: {
      contentBase: path.join(__dirname, 'public'),
      watchContentBase: true,
      host: 'localhost',
      hot: false,
    },

    plugins: [
      new EnvironmentPlugin(['NODE_ENV']),
      new CopyPlugin({
        patterns: ['./src/static'],
      }),
      new HtmlWebpackPlugin({
        alwaysWriteToDisk: true,
        template: './src/index.html',
      }),
      new HtmlWebpackPlugin({
        alwaysWriteToDisk: true,
        filename: 'frame.html',
        template: './src/frame.html',
      }),
      new HtmlWebpackHarddiskPlugin(),
      new MiniCssExtractPlugin({
        filename: 'build/[name].css',
        chunkFilename: 'build/[id].css',
      }),
      !devMode && new CleanWebpackPlugin(),
    ].filter(Boolean),
  };
};