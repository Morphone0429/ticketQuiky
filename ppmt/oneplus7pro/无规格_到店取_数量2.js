let { baseConfig, patchPointGroup } = require("/sdcard/脚本/configGroup.js");
let { main } = require("/sdcard/脚本/main.js");
auto();

let config = baseConfig.no_market_more;
let point = patchPointGroup(config).oneplus7pro;

main();
