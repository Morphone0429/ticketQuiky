let { baseConfig, patchPointGroup, utils } = require("/sdcard/脚本/configGroup.js");
let { main } = require("/sdcard/脚本/main.js");
auto();

let config = baseConfig.have_home_more;
let point = patchPointGroup(config).p30pro;

main();
