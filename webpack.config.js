var webpack = require("webpack");
var LessPluginCleanCSS = require("less-plugin-clean-css");
var LessPluginAutoPrefix = require("less-plugin-autoprefix");

module.exports = {
    entry: {
        app: [
            "./src/app.js"
        ]
    },
    output: {
        path: "/build/assets/",
        publicPath: "/js/",
        filename: "taskrunner.js"
    },
    cache: true,
    debug: true,
    devtool: "source-map",
    stats: {
        colors: true,
        reasons: false
    },
    plugins: [
        new webpack.optimize.DedupePlugin(),
        // new webpack.optimize.UglifyJsPlugin({
        //     compress: {
        //         warnings: false
        //     },
        //     mangle: true
        // }),
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.optimize.AggressiveMergingPlugin(),
        new webpack.NoErrorsPlugin()
        /*new webpack.optimize.CommonsChunkPlugin({
         name: "vendor",
         minChunks: Infinity,
         filename: "vendor.js"
         })*/
    ],
    resolve: {
        extensions: ["", ".js", ".jsx"],
        alias: {
            "styles": __dirname + "/src/styles",
            "components": __dirname + "/src/components/"
        }
    },
    externals: {
        //don't bundle the 'react' npm package with our bundle.js
        //but get it from a global 'React' variable
        // 'react': 'React'
        //"axios": "axios",
        //"bluebird": "Promise",
        //"es5-shim": "es5-shim",
        //"lodash": "_",
        //"react": "React",
        //"react-dom": "ReactDOM",
        //"moment": "moment"
    },
    lessLoader: {
        lessPlugins: [
            new LessPluginCleanCSS({advanced: true}),
            new LessPluginAutoPrefix({browsers: ["not ie <= 8"]})
        ]
    },
    module: {
        loaders: [{
            test: /\.(js|jsx)$/,
            exclude: /node_modules/,
            loader: "babel-loader"
        }, {
            test: /\.css$/,
            loader: "style-loader!css-loader"
        }, {
            test: /\.less/,
            loader: "style-loader!css-loader!less-loader"
        }, {
            test: /\.(png|jpg|gif|woff|woff2)$/,
            loader: "url-loader?limit=8192"
        }]
    }
};
