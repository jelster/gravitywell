const path = require("path");
const CleanWebpackPlugin = require('clean-webpack-plugin').CleanWebpackPlugin;
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    output: {
        path: path.resolve('./dist'),
        publicPath: '',
        filename: "[name].js",
        assetModuleFilename: '[path][name][ext]'
    },
    entry: [
        './src/index.ts'
    ],
    devtool: 'source-map',
    devServer: {
        contentBase: './dist'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
        },
        {
            test: /\.png|jpg|jpeg|svg|glib/,
            type: 'asset/resource'
        }
        ]
    },
    plugins: [
        // Cleans the dist folder before the build starts
        new CleanWebpackPlugin(),
        // Generate a base html file and injects all generated css and js files
        new HtmlWebpackPlugin({
            template: 'index.html'
        })
    ]
};
