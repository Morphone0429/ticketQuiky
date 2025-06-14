let { baseConfig, patchPointGroup,utils } = require("/sdcard/脚本/configGroup.js");
let { main } = require("/sdcard/脚本/main.js");
auto();

let config = baseConfig.have_market;
let point = patchPointGroup(config).oneplus_ace3pro;

main();
