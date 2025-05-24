let baseConfig = {
  // 有规格_寄到家_6个
  have_home: {
    frequency: "NORMAL",
    singleMode: false,
    sixMode: true,
    sendToHome: true,
    goMarkGet: false,
    orcSleepTime: 200,
    addOne: false,
  },
  // 有规格_到店取_6个
  have_market: {
    frequency: "NORMAL",
    singleMode: false,
    sixMode: true,
    sendToHome: false,
    goMarkGet: true,
    orcSleepTime: 200,
    addOne: false,
  },
  // 无规格_寄到家
  no_home: {
    frequency: "NORMAL",
    singleMode: false,
    sixMode: false,
    sendToHome: true,
    goMarkGet: false,
    orcSleepTime: 200,
    addOne: false,
  },
  // 无规格_到店取
  no_market: {
    frequency: "NORMAL",
    singleMode: false,
    sixMode: false,
    sendToHome: false,
    goMarkGet: true,
    orcSleepTime: 200,
    addOne: false,
  },
  // 有规格_寄到家_6个_数量2
  have_home_more: {
    frequency: "NORMAL",
    singleMode: false,
    sixMode: true,
    sendToHome: true,
    goMarkGet: false,
    orcSleepTime: 200,
    addOne: true,
  },
  // 有规格_到店取_6个_数量2
  have_market_more: {
    frequency: "NORMAL",
    singleMode: false,
    sixMode: true,
    sendToHome: false,
    goMarkGet: true,
    orcSleepTime: 200,
    addOne: true,
  },
  // 无规格_寄到家_数量2
  no_home_more: {
    frequency: "NORMAL",
    singleMode: false,
    sixMode: false,
    sendToHome: true,
    goMarkGet: false,
    orcSleepTime: 200,
    addOne: true,
  },
  // 无规格_到店取_数量2
  no_market_more: {
    frequency: "NORMAL",
    singleMode: false,
    sixMode: false,
    sendToHome: false,
    goMarkGet: true,
    orcSleepTime: 200,
    addOne: true,
  },
};

function patchPointGroup(config) {
  return {
    oneplus_ace3pro: {
      originSingleModePoint: { x: [114, 412], y: [1212, 1292] }, // 整盒含6个盲盒
      originSixModePoint: { x: [567, 815], y: [1212, 1292] }, // 单个盲盒随机发货
      originSendToHomePoint: {
        x: [82, 252],
        y: !config.sixMode && !config.singleMode ? [1174, 1271] : [1552, 1649],
      }, // 送到家按钮
      originGoMarkGetPoint: {
        x: [342, 520],
        y: !config.sixMode && !config.singleMode ? [1174, 1271] : [1552, 1649],
      }, // 到店取按钮
      originAcountAddPoint: {
        x: [1143, 1190],
        y:
          !config.sixMode && !config.singleMode
            ? config.sendToHome
              ? [1565, 1595]
              : [1788, 1839]
            : config.sendToHome
            ? [1926, 1979]
            : [2167, 2209],
      }, // 数量增加按钮
      originAcountLessPoint: {
        x: [961, 998],
        y:
          !config.sixMode && !config.singleMode
            ? config.sendToHome
              ? [1565, 1595]
              : [1788, 1839]
            : config.sendToHome
            ? [1926, 1979]
            : [2167, 2209],
      }, // 数量减少按钮
      originalQuickBtnPointWithOutCarPoint: {
        x: [319, 1183],
        y: [2558, 2678],
      }, // 立即购买按钮(无加入购物车)
      originalQuickBtnPointWithCarPoint: { x: [785, 1179], y: [2567, 2675] }, // 立即购买按钮(有加入购物车)
      originSurePoint: { x: [128, 1149], y: [2446, 2554] }, // 选择购买方式页面有货时 确定按钮
      originThisMarkPoint: { x: [234, 1010], y: [1760, 1840] }, // 确定订单页面 确认门店信息  就是这家按钮
      originNoProdPoint: { x: [400, 860], y: [1380, 1480] }, // 没货提示 <我知道了>按钮
      originknowMailPoint: { x: [240, 1020], y: [1700, 1800] }, // 请确认收货地址  确认无误按钮
      originSureInfoAndPayPoint: { x: [780, 1175], y: [2573, 2680] }, //确认订单页面 确认信息并支付
      originBackScreenPoint: { x: [64, 75], y: [190, 230] },
    },
  };
}

module.exports = {
  baseConfig,
  patchPointGroup,
};
