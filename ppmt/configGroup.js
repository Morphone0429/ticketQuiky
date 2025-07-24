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
    temp: {
      originSingleModePoint: { x: [], y: [] }, //   1
      originSixModePoint: { x: [], y: [] }, //
      originSendToHomePoint: {
        x: [],
        y: !config.sixMode && !config.singleMode ? [] : [],
      }, // 送到家按钮
      originGoMarkGetPoint: {
        x: [],
        y: !config.sixMode && !config.singleMode ? [] : [],
      }, // 到店取按钮
      originAcountLessPoint: {
        x: [],
        y:
          !config.sixMode && !config.singleMode
            ? config.sendToHome
              ? []
              : []
            : config.sendToHome
            ? []
            : [],
      }, // 数量减少按钮
      originAcountAddPoint: {
        x: [],
        y:
          !config.sixMode && !config.singleMode
            ? config.sendToHome
              ? []
              : []
            : config.sendToHome
            ? []
            : [],
      }, // 数量增加按钮
      originalQuickBtnPointWithOutCarPoint: {
        x: [],
        y: [],
      }, // 立即购买按钮(无加入购物车)
      originalQuickBtnPointWithCarPoint: { x: [], y: [] }, // 立即购买按钮(有加入购物车)
      originSurePoint: { x: [], y: [] }, // 选择购买方式页面有货时 确定按钮
      originThisMarkPoint: { x: [], y: [] }, // 确定订单页面 确认门店信息  就是这家按钮
      originNoProdPoint: { x: [], y: [] }, // 没货提示 <我知道了>按钮
      originknowMailPoint: { x: [], y: [] }, // 请确认收货地址  确认无误按钮
      originSureInfoAndPayPoint: { x: [], y: [] }, //确认订单页面 确认信息并支付
      originBackScreenPoint: { x: [], y: [] }, //
      originPayPoints: [
        { x: [], y: [] }, //2
        { x: [], y: [] }, // 2
        { x: [], y: [] }, // 0
        { x: [], y: [] }, // 3
        { x: [], y: [] }, // 0
        { x: [], y: [] }, // 7
      ],
    },
    oneplus_ace3pro: {
      originSingleModePoint: { x: [114, 412], y: [1212, 1292] },
      originSixModePoint: { x: [567, 815], y: [1212, 1292] },
      originSendToHomePoint: {
        x: [82, 252],
        y: !config.sixMode && !config.singleMode ? [1174, 1271] : [1552, 1649],
      }, // 送到家按钮
      originGoMarkGetPoint: {
        x: [342, 520],
        y: !config.sixMode && !config.singleMode ? [1174, 1271] : [1552, 1649],
      }, // 到店取按钮
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
      originalQuickBtnPointWithOutCarPoint: {
        x: [319, 1183],
        y: [2558, 2678],
      }, // 立即购买按钮(无加入购物车)
      originalQuickBtnPointWithCarPoint: { x: [785, 1179], y: [2567, 2675] }, // 立即购买按钮(有加入购物车)
      originSurePoint: { x: [128, 1149], y: [2446, 2554] }, // 选择购买方式页面有货时 确定按钮
      originThisMarkPoint: { x: [234, 1010], y: [1851, 1853] }, // 确定订单页面 确认门店信息  就是这家按钮
      originNoProdPoint: { x: [400, 860], y: [1430, 1463] }, // 没货提示 <我知道了>按钮
      originknowMailPoint: { x: [240, 1020], y: [1700, 1800] }, // 请确认收货地址  确认无误按钮
      originSureInfoAndPayPoint: { x: [780, 1175], y: [2573, 2680] }, //确认订单页面 确认信息并支付
      originBackScreenPoint: { x: [64, 75], y: [190, 230] },
      originPayPoints: [
        { x: [927, 1121], y: [2040, 2125] }, //3
        { x: [927, 1121], y: [2040, 2125] }, //3
        { x: [520, 763], y: [2592, 2670] }, // 0
        { x: [116, 346], y: [2220, 2320] }, // 4
        { x: [520, 763], y: [2040, 2125] }, // 2
        { x: [927, 1121], y: [2403, 2496] }, // 9
      ],
    },
    opporeno5: {
      originSingleModePoint: { x: [90, 360], y: [1072, 1130] }, //  1
      originSixModePoint: { x: [493, 736], y: [1072, 1130] }, //  1
      originSendToHomePoint: {
        x: [87, 210],
        y: !config.sixMode && !config.singleMode ? [1041, 1105] : [1363, 1432],
      }, // 送到家按钮 1
      originGoMarkGetPoint: {
        x: [342, 445],
        y: !config.sixMode && !config.singleMode ? [1041, 1105] : [1363, 1432],
      }, // 到店取按钮  1
      originAcountLessPoint: {
        x: [818, 863],
        y:
          !config.sixMode && !config.singleMode
            ? config.sendToHome
              ? [1354, 1398]
              : [1552, 1598]
            : config.sendToHome
            ? [1680, 1712]
            : [1887, 1925],
      }, // 数量减少按钮 1
      originAcountAddPoint: {
        x: [973, 1022],
        y:
          !config.sixMode && !config.singleMode
            ? config.sendToHome
              ? [1354, 1398]
              : [1552, 1598]
            : config.sendToHome
            ? [1680, 1712]
            : [1887, 1925],
      }, // 数量增加按钮 1

      originalQuickBtnPointWithOutCarPoint: {
        x: [286, 994],
        y: [2209, 2304],
      }, // 立即购买按钮(无加入购物车) 1
      originalQuickBtnPointWithCarPoint: { x: [696, 999], y: [2223, 2315] }, // 立即购买按钮(有加入购物车) 1
      originSurePoint: { x: [136, 996], y: [2114, 2211] }, // 选择购买方式页面有货时 确定按钮 1
      originThisMarkPoint: { x: [233, 866], y: [1502, 1582] }, // 确定订单页面 确认门店信息  就是这家按钮  1
      originNoProdPoint: { x: [397, 708], y: [1194, 1232] }, // 没货提示 <我知道了>按钮 1
      originknowMailPoint: { x: [214, 855], y: [1467, 1540] }, // 请确认收货地址  确认无误按钮 1
      originSureInfoAndPayPoint: { x: [668, 997], y: [2225, 2317] }, //确认订单页面 确认信息并支付 1
      originBackScreenPoint: { x: [50, 70], y: [154, 184] }, //1
      originPayPoints: [
        { x: [447, 654], y: [1774, 1845] }, //2
        { x: [447, 654], y: [1774, 1845] }, // 2
        { x: [447, 654], y: [2232, 2307] }, // 0
        { x: [807, 955], y: [1774, 1845] }, // 3
        { x: [447, 654], y: [2232, 2307] }, // 0
        { x: [107, 249], y: [2081, 2153] }, // 7
      ],
    },
    oneplus7pro: {
      originSingleModePoint: { x: [112, 491], y: [1361, 1420] }, //
      originSixModePoint: { x: [652, 967], y: [1361, 1420] }, //
      originSendToHomePoint: {
        x: [112, 266],
        y: !config.sixMode && !config.singleMode ? [1303, 1389] : [1751, 1813],
      }, // 送到家按钮
      originGoMarkGetPoint: {
        x: [423, 581],
        y: !config.sixMode && !config.singleMode ? [1303, 1389] : [1751, 1813],
      }, // 到店取按钮
      originAcountLessPoint: {
        x: [1092, 1144],
        y:
          !config.sixMode && !config.singleMode
            ? config.sendToHome
              ? [1722, 1790]
              : [1984, 2046]
            : config.sendToHome
            ? [2154, 2214]
            : [2421, 2478],
      }, // 数量减少按钮
      originAcountAddPoint: {
        x: [1299, 1367],
        y:
          !config.sixMode && !config.singleMode
            ? config.sendToHome
              ? [1722, 1790]
              : [1984, 2046]
            : config.sendToHome
            ? [2154, 2214]
            : [2421, 2478],
      }, // 数量增加按钮

      originalQuickBtnPointWithOutCarPoint: {
        x: [395, 1345],
        y: [2886, 3023],
      }, // 立即购买按钮(无加入购物车)
      originalQuickBtnPointWithCarPoint: { x: [911, 1344], y: [2877, 3002] }, // 立即购买按钮(有加入购物车)
      originSurePoint: { x: [131, 1280], y: [2749, 2885] }, // 选择购买方式页面有货时 确定按钮
      originThisMarkPoint: { x: [294, 1176], y: [2070, 2074] }, // 确定订单页面 确认门店信息  就是这家按钮
      originNoProdPoint: { x: [450, 996], y: [1544, 1664] }, // 没货提示 <我知道了>按钮
      originknowMailPoint: { x: [292, 1162], y: [1915, 2018] }, // 请确认收货地址  确认无误按钮
      originSureInfoAndPayPoint: { x: [869, 1364], y: [2888, 3031] }, //确认订单页面 确认信息并支付
      originBackScreenPoint: { x: [71, 87], y: [195, 240] }, //
      originPayPoints: [
        { x: [1056, 1352], y: [2708, 2808] }, // 9
        { x: [614, 836], y: [2900.3002] }, // 0
        { x: [1056, 1352], y: [2290, 2390] }, // 3
        { x: [614, 836], y: [2708, 2808] }, // 8
        { x: [614, 836], y: [2290, 2390] }, // 2
        { x: [614, 836], y: [2900.3002] }, // 0
      ],
    },
    vivoy53s: {
      originSingleModePoint: { x: [84, 360], y: [1136, 1181] }, //   1
      originSixModePoint: { x: [483, 711], y: [1136, 1181] }, //
      originSendToHomePoint: {
        x: [78, 194],
        y: !config.sixMode && !config.singleMode ? [1090, 1160] : [1424, 1478],
      }, // 送到家按钮
      originGoMarkGetPoint: {
        x: [315, 430],
        y: !config.sixMode && !config.singleMode ? [1090, 1160] : [1424, 1478],
      }, // 到店取按钮
      originAcountLessPoint: {
        x: [814, 856],
        y:
          !config.sixMode && !config.singleMode
            ? config.sendToHome
              ? [1410, 1459]
              : [1607, 1658]
            : config.sendToHome
            ? [1735, 1770]
            : [1937, 1980],
      }, // 数量减少按钮
      originAcountAddPoint: {
        x: [977, 1025],
        y:
          !config.sixMode && !config.singleMode
            ? config.sendToHome
              ? [1410, 1459]
              : [1607, 1658]
            : config.sendToHome
            ? [1735, 1770]
            : [1937, 1980],
      }, // 数量增加按钮
      originalQuickBtnPointWithOutCarPoint: {
        x: [304, 960],
        y: [2276, 2365],
      }, // 立即购买按钮(无加入购物车)
      originalQuickBtnPointWithCarPoint: { x: [697, 988], y: [2265, 2359] }, // 立即购买按钮(有加入购物车)
      originSurePoint: { x: [126, 985], y: [2170, 2266] }, // 选择购买方式页面有货时 确定按钮
      originThisMarkPoint: { x: [236, 863], y: [1528, 1597] }, // 确定订单页面 确认门店信息  就是这家按钮
      originNoProdPoint: { x: [363, 731], y: [1150, 1227] }, // 没货提示 <我知道了>按钮
      originknowMailPoint: { x: [204, 844], y: [1476, 1567] }, // 请确认收货地址  确认无误按钮
      originSureInfoAndPayPoint: { x: [655, 995], y: [2274, 2374] }, //确认订单页面 确认信息并支付
      originBackScreenPoint: { x: [53, 66], y: [138, 158] }, //
      originPayPoints: [
        { x: [], y: [] }, //2
        { x: [], y: [] }, // 2
        { x: [], y: [] }, // 0
        { x: [], y: [] }, // 3
        { x: [], y: [] }, // 0
        { x: [], y: [] }, // 7
      ],
    },
    p30pro: {
      originSingleModePoint: { x: [88, 359], y: [1052, 1125] }, //   1
      originSixModePoint: { x: [473, 712], y: [1052, 1125] }, //
      originSendToHomePoint: {
        x: [62, 218],
        y: !config.sixMode && !config.singleMode ? [1026, 1094] : [1348, 1421],
      }, // 送到家按钮
      originGoMarkGetPoint: {
        x: [303, 445],
        y: !config.sixMode && !config.singleMode ? [1026, 1094] : [1348, 1421],
      }, // 到店取按钮
      originAcountLessPoint: {
        x: [822, 864],
        y:
          !config.sixMode && !config.singleMode
            ? config.sendToHome
              ? [1340, 1384]
              : [1545, 1586]
            : config.sendToHome
            ? [1661, 1712]
            : [1866, 1915],
      }, // 数量减少按钮
      originAcountAddPoint: {
        x: [981, 1025],
        y:
          !config.sixMode && !config.singleMode
            ? config.sendToHome
              ? [1340, 1384]
              : [1545, 1586]
            : config.sendToHome
            ? [1661, 1712]
            : [1866, 1915],
      }, // 数量增加按钮
      originalQuickBtnPointWithOutCarPoint: {
        x: [321, 943],
        y: [2218, 2297],
      }, // 立即购买按钮(无加入购物车)
      originalQuickBtnPointWithCarPoint: { x: [686, 982], y: [2204, 2282] }, // 立即购买按钮(有加入购物车)
      originSurePoint: { x: [124, 981], y: [2134, 2173] }, // 选择购买方式页面有货时 确定按钮
      originThisMarkPoint: { x: [217, 877], y: [1582, 1585] }, // 确定订单页面 确认门店信息  就是这家按钮
      originNoProdPoint: { x: [384, 735], y: [1190, 1242] }, // 没货提示 <我知道了>按钮
      originknowMailPoint: { x: [256, 854], y: [1457, 1543] }, // 请确认收货地址  确认无误按钮
      originSureInfoAndPayPoint: { x: [684, 1007], y: [2204, 2297] }, //确认订单页面 <确认信息并支付>
      originBackScreenPoint: { x: [54, 60], y: [154, 184] }, //
      originPayPoints: [
        { x: [430, 660], y: [1765, 1833] }, //2
        { x: [430, 660], y: [1765, 1833] }, // 2
        { x: [430, 660], y: [2219, 2300] }, // 0
        { x: [810, 1000], y: [1765, 1833] }, // 3
        { x: [430, 660], y: [2219, 2300] }, // 0
        { x: [95, 300], y: [2065, 2150] }, // 7
      ],
    },
  };
}

let utils = {
  // 下拉刷新
  trySwipeUp: function () {
    // 获取屏幕尺寸
    let width = device.width;
    let height = device.height;
    // 设置下拉起始点和结束点（从屏幕中部向下滑动）
    let startX = width / 2;
    let startY = height / 2;
    let endY = startY + 800; // 下拉距离，可根据需要调整
    // 执行下拉手势
    gesture(1000, [startX, startY], [startX, endY]);
    // 等待刷新完成（时间可根据实际情况调整）},
  },
  // 获取orc
  getOrcScreen: function () {
    let startTime = Date.now();
    let img = images.captureScreen();
    let region = [0, 0.2, -1, 0.6];
    let currentScreenOcr = ocr(img, region).map((i) => i.trim());
    img.recycle();
    let endTime = Date.now();
    let elapsedTime = endTime - startTime;
    let generateId = startTime + "-" + elapsedTime;
    return { currentScreenOcr, elapsedTime, startTime, generateId, endTime };
  },

  // 模拟点击
  simulateClick: function ({ x, y, clickTime }) {
    if (!x || !y) return;
    let _x = random(x[0], x[1]);
    let _y = random(y[0], y[1]);
    // click(_x, _y);
    // return;
    if (!!clickTime) {
      press(_x, _y, clickTime);
    } else {
      let _random = random(1, 11);
      let isEven = _random % 2 === 0;
      if (isEven) {
        let _randomDuration = random(20, 40) || 30;
        press(_x, _y, _randomDuration);
      } else {
        click(_x, _y);
      }
    }
  },

  patchScreen: function ({ currentScreenOcr }) {
    let quickBuyScreen = currentScreenOcr.includes("购物车");
    let markListScreen =
      currentScreenOcr.includes("自提门店列表") ||
      currentScreenOcr.some((item) => item.includes("门店列表"));
    let hasSureBtn =
      currentScreenOcr.includes("确定") ||
      currentScreenOcr.some((item) => item.includes("确定"));
    let chooseDetailScreen =
      currentScreenOcr.includes("购买方式") ||
      currentScreenOcr.some((item) => item.includes("买方式")) ||
      currentScreenOcr.includes("到店取") ||
      currentScreenOcr.includes("送到家");
    let makeSureOrderScreen =
      currentScreenOcr.some((item) => item.includes("确认信息")) ||
      currentScreenOcr.some((item) => item.includes("合计"));
    let hasAddCar = currentScreenOcr.includes("加入购物车");
    let hasQuickBuyBtn = currentScreenOcr.includes("立即购买");
    let hasQuickBuyErrorBtn =
      currentScreenOcr.some((item) => item.includes("00:00")) ||
      currentScreenOcr.some((item) => item.includes("0000"));
    let hasTrySoon = currentScreenOcr.some((item) =>
      item.includes("请稍后重试")
    );
    let POPMARTLoading =
      currentScreenOcr.some((item) => item.includes("POP")) ||
      currentScreenOcr.some((item) => item.includes("MAR")); //popmark 红色loading
    let newScreenOcr = currentScreenOcr.slice(currentScreenOcr.length - 6);
    let hasAddAmount =
      newScreenOcr.some((item) => item.includes("2")) ||
      newScreenOcr.includes("2");
    return {
      quickBuyScreen,
      chooseDetailScreen,
      makeSureOrderScreen,
      hasAddCar,
      hasQuickBuyBtn,
      hasQuickBuyErrorBtn,
      markListScreen,
      POPMARTLoading,
      hasTrySoon,
      hasSureBtn,
      hasAddAmount,
    };
  },
};

module.exports = {
  baseConfig,
  patchPointGroup,
  utils,
};
