let nodeExternals = require('webpack-node-external');

module.exports = {
	target: 'node',
	externals: [nodeExternals()],
};
