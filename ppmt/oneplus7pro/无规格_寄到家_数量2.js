let { baseConfig, patchPointGroup,utils } = require("/sdcard/脚本/configGroup.js");
let { main } = require("/sdcard/脚本/main.js");
auto();

let config = baseConfig.no_home_more;
let point = patchPointGroup(config).oneplus7pro;

main();
