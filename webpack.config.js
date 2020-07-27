const path = require("path");

var SRC_DIR = path.join(__dirname, "./src");
var DIST_DIR = path.join(__dirname, "./www");
var packageVersion = require('./package.json').version;

var HtmlWebpackPlugin = require('html-webpack-plugin');
var HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');

var buildConfig = function (env) {
    var isProd = env === "prod";
    return {
        context: __dirname,
        output: {
            path: DIST_DIR,
            publicPath: '',
            filename: "[name].js",
        },
        devtool: isProd ? "none" : "source-map",
        devServer: {
            openPage: '.'
        },
        resolve: {
            extensions: [".ts", ".js"]
        },
        module: {
            rules: [{
                test: /\.tsx?$/,
                loader: "ts-loader",
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            }
            ]
        },
        mode: isProd ? "production" : "development",
        plugins: [
            new HtmlWebpackPlugin({
                alwaysWriteToDisk: true,
                template: path.join(SRC_DIR, 'index.html'),
                title: "Gravity Well - " + packageVersion,
                filename: path.join(DIST_DIR, 'index.html')
            }),
            new HtmlWebpackHarddiskPlugin()
        ]
    };
}

module.exports = buildConfig;