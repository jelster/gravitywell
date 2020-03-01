module.exports = {
    // entry: [
    //     __dirname + "/index.html"
    //   ],
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [{
            test: /\.tsx?$/,
            loader: 'ts-loader'
        }]
    }
}