// Require all SVGs in the sprite so that they are processed through
// webpack.
//
// This file must stay CommonJS (.cjs). package.json sets "type": "module", so a
// .js file here would be treated as ESM, where `require.context` is not a
// webpack construct — webpack would emit the call verbatim, no SVG would reach
// svg-sprite-loader, and dist/images/sprite.artifact.svg would silently not be
// generated. The webpack entry glob matches `{cjs,js,ts}` and strips the
// extension, so the emitted bundle is still dist/js/sprite.js.

require.context('.', true, /\.svg$/);
