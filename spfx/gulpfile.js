'use strict';

const build = require('@microsoft/sp-build-web');

build.addSuppression(
  `Warning - [sass] The local CSS class 'ms-Grid' is not camelCase and will not be type-safe.`
);

const getTasks = build.rig.getTasks;
build.rig.getTasks = function () {
  const result = getTasks.call(build.rig);
  result.set('serve', result.get('serve-deprecated'));
  return result;
};

build.configureWebpack.mergeConfig({
  additionalConfiguration: (config) => {
    // Allow .jsx files to be resolved and processed
    if (config.resolve && config.resolve.extensions) {
      if (!config.resolve.extensions.includes('.jsx')) {
        config.resolve.extensions.push('.jsx');
      }
    }
    // Handle image assets
    config.module.rules.push({
      test: /\.(png|jpg|jpeg|gif|svg)$/,
      use: [{ loader: 'url-loader', options: { limit: 100000 } }],
    });
    return config;
  },
});

build.initialize(require('gulp'));
