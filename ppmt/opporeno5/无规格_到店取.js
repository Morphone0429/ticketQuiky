let {
  baseConfig,
  patchPointGroup,
  utils,
s} = require("/sdcard/脚本/configGroup.js");
let { main } = require("/sdcard/脚本/main.js");
auto();

let config = baseConfig.no_market;
let point = patchPointGroup(config).opporeno5;

main();
