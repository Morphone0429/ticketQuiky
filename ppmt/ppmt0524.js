let { baseConfig, patchPointGroup } = require("/sdcard/脚本/configGroup.js");
let { main } = require("/sdcard/脚本/main.js");
auto();
/**
 * 有规格_寄到家_6个 have_home
 * 有规格_寄到家_6个_数量2 have_home_more
 * 有规格_到店取_6个  have_market
 * 有规格_到店取_6个_数量2  have_market_more
 * 无规格_寄到家  no_home
 * 无规格_寄到家_数量2  no_home_more
 * 无规格_到店取  no_market
 * 无规格_到店取_数量2 no_market_more
 * */
let config = baseConfig.have_home;
let point = patchPointGroup(config).oneplus_ace3pro;

main();
