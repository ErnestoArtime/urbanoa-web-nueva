module.exports = {
  rules: {
    'color-no-invalid-hex': true,
    'declaration-block-no-duplicate-properties': true,
    'declaration-no-important': true,
    'block-no-empty': true,
    'selector-pseudo-element-no-unknown': true,
    'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['host', 'host-context'] }],
    'property-no-unknown': true,
  },
};
