const path = require("path");

var SRC_DIR = path.resolve(__dirname, "./src");
var DIST_DIR = path.resolve(__dirname, "./www");
var DEV_DIR = path.resolve(__dirname, "./.temp");
var packageVersion = require('./package.json').version;

var HtmlWebpackPlugin = require('html-webpack-plugin');

 var buildConfig = function(env) {
    var isProd = env === "prod";
    return {
        context: __dirname,
        output: {
            path: DIST_DIR,
            publicPath: DIST_DIR,
            filename: "scripts/[name].js",
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
        plugins: [ new HtmlWebpackPlugin({
            template: SRC_DIR + '/index.html',
            title: "Gravity Well - " + packageVersion,
            filename: 'index.html'
            
        })]
    };
 }

module.exports = buildConfig;