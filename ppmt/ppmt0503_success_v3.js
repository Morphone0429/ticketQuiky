auto();

const toBuyBtnPath = "/sdcard/Pictures/Screenshots/lijigoumai.jpg";
const toBuyWithCarBtnPath =
  "/sdcard/Pictures/Screenshots/withcarlijigoumai.jpg";
const yisouqingPath = "/sdcard/Pictures/Screenshots/yisouqing.jpg";
const songdaojiaPath = "/sdcard/Pictures/Screenshots/songdaojia.jpg";
const daodianquPath = "/sdcard/Pictures/Screenshots/daodianqu.jpg";
const suliangPath = "/sdcard/Pictures/Screenshots/suliang.jpg";
const baoyouPath = "/sdcard/Pictures/Screenshots/baoyou.jpg"; //送到家模式
const daodianjiantouPath = "/sdcard/Pictures/Screenshots/daodianjiantou.jpg"; //到店取模式
const dangePath = "/sdcard/Pictures/Screenshots/dange.jpg"; //single模式
const liugePath = "/sdcard/Pictures/Screenshots/liuge.jpg"; //6模式
const surePath = "/sdcard/Pictures/Screenshots/sure.jpg"; //sure模式
const surepayinfoPath = "/sdcard/Pictures/Screenshots/surepayinfo.jpg"; //surepayinfo模式
const thisonePath = "/sdcard/Pictures/Screenshots/thisone.jpg"; //surepayinfo模式
const wozhidaolePath = "/sdcard/Pictures/Screenshots/wozhidaole.jpg"; //surepayinfo模式
const querenwuwuPath = "/sdcard/Pictures/Screenshots/querenwuwu.jpg"; //plzadress
const xuanzhemdPath = "/sdcard/Pictures/Screenshots/xuanzhemd.jpg"; //xuanzhemd

const config = {
  /***
   * 刷新频率  默认NORMAL
   *  
    IMMEDIATE     // 立即执行 20ms
    VERY_FAST   // 快速更新 20-130ms毫秒随机
    FAST        // 较快更新 130-230ms毫秒随机
    NORMAL      // 标准间隔 230-500ms毫秒随机
    SLOW     // 较慢更新 500-860ms毫秒随机
    VERY_SLOW  // 慢速更新 860-1500ms毫秒随机
   */
  frequency: "NORMAL",
  singleMode: false, // single模式
  sixMode: false, // 6模式
  sendToHome: true, // 送到家模式
  goMarkGet: false, // 到店取模式
  orcSleepTime: 500, // orc 刷新频率  根据调试机型设置
};

const onePlus_ace_3_pro_device = {
  width: 1264,
  height: 2780,
};

// 真机按钮 信息
const originPoint = {
  //  按钮信息 ------start ------
  originSixModePoint: { x: 257, y: 1258 }, // 单个盲盒随机发货 ojbk  未使用
  originSingleModePoint: { x: 694.5, y: 1258 }, // 整盒含6个盲盒 ojbk 未使用
  originSendToHomePoint: {
    x: 161,
    y: !config.sixMode && !config.singleMode ? 1223 : 1601,
  }, // 送到家按钮 ojbk [161,1223] [161,1601]
  originGoMarkGetPoint: {
    x: 434,
    y: !config.sixMode && !config.singleMode ? 1223 : 1601,
  }, // 到店取按钮 ojbk  [434,1223] [434,1601]
  originAcountAddPoint: {
    x: 1172,
    y: !config.sixMode && !config.singleMode ? 1578 : 2191,
  }, // 数量增加按钮 ojbk [1172,1578] [1172,2191]
  originalQuickBtnPointWithOutCarPoint: { x: 748.5, y: 2619.5 }, // 立即购买按钮(无加入购物车) ojbk
  originalQuickBtnPointWithCarPoint: { x: 986.5, y: 2619.5 }, // 立即购买按钮(有加入购物车) ojbk
  originSurePoint: { x: 631.5, y: 2504.0 }, // 选择购买方式页面有货时 确定按钮 ojbk
  originThisMarkPoint: { x: 631.5, y: 1799.0 }, // 确定订单页面 确认稳点信息  就是这家按钮 ojbk
  originNoProdPoint: { x: 631.5, y: 1468.5 }, // 没货提示 我知道了按钮  ojbk
  originknowMailPoint: { x: 236.0, y: 1716.0 },
  originSureInfoAndPayPoint: { x: 980, y: 2627.0 }, //确认订单页面 确认信息并支付 ojbk
  //  按钮信息 ------end -----
};

const state = {
  initBuyConfig: false, // 初始化规格
  buyMethod: "home", // home | mark
  enterSureLoop: false,
  loopCount: 0,
  //  按钮信息 ------start ------
  sixModePoint: null,
  singleModePoint: null,
  sendToHomePoint: null,
  goMarkGetPoint: null,
  acountAddPoint: null,
  quickBtnPointWithOutCarPoint: null,
  quickBtnPointWithCarPoint: null,
  surePoint: null,
  sureInfoAndPayPoint: null,
  thisMarkPoint: null,
  knowMailPoint: null,
  noProdPoint: null,

  //  按钮信息 ------end ------
};

function start() {
  requestScreenCapture();
  startToBuy(); // 寻找立即购买按钮
}

// 点击立即购买按钮
function startToBuy() {
  // 初始化按钮信息
  initPointInfo();
  console.log(config, state, "初始化购买配置页面");
  const run = (point, mode) => {
    if (mode === "quickBuyWithCar") {
      state.quickBtnPointWithCarPoint = point;
    }
    if (mode === "quickBuyWithoutCar") {
      state.quickBtnPointWithOutCarPoint = point;
    }
    console.log("开始点击立即购买按钮,点击的位置", point, mode);
    click(point.x, point.y);
    initBuyMethod(); //初始化购买配置页面
  };
  screenIsLoadedWithOcr({
    callBack: (mode) => {
      if (mode === "quickBuyWithCar") {
        run(originPoint.originalQuickBtnPointWithCarPoint, mode);
      }
      if (mode === "quickBuyWithoutCar") {
        if (state.quickBtnPointWithOutCarPoint) {
          run(state.quickBtnPointWithOutCarPoint, mode);
        } else {
          returnPoint({
            tmpPath: toBuyBtnPath,
            callBack: (point) => {
              run(point, mode);
            },
          });
        }
      }
    },
  });
}

// 初始化按钮信息
function initPointInfo() {
  // 判断是否有origin 按钮的信息
  patchOriginPointToImagePoint();
}

//初始化购买配置页面
function initBuyMethod() {
  const init = () => {
    if (state.initBuyConfig) {
      handleBuyMethod();
      return;
    }
    const run = ({ point, buyMethod }) => {
      if (buyMethod === "home") {
        state.sendToHomePoint = point;
      }
      if (buyMethod === "mark") {
        state.goMarkGetPoint = point;
      }
      patchSpecification(() => {
        state.buyMethod = buyMethod;
        console.log(point, buyMethod);
        click(point.x, point.y);

        state.initBuyConfig = true;
        handleBuyMethod();
      });
    };

    // 仅送到家
    if (config.sendToHome && !config.goMarkGet) {
      if (state.sendToHomePoint) {
        run({ point: state.sendToHomePoint, buyMethod: "home" });
      }
      returnPoint({
        tmpPath: songdaojiaPath,
        callBack: (point) => {
          run({ point, buyMethod: "home" });
        },
      });
    }

    // 仅到店取
    // 送到家 && 到店取
    if (
      (!config.sendToHome && config.goMarkGet) ||
      (config.sendToHome && config.goMarkGet)
    ) {
      console.log(state.goMarkGetPoint, "state.goMarkGetPoint--------=-=-=");
      if (state.goMarkGetPoint) {
        run({
          point: state.goMarkGetPoint,
          buyMethod: "mark",
        });
      } else {
        returnPoint({
          tmpPath: daodianquPath,
          callBack: (point) => {
            run({ point, buyMethod: "mark" });
          },
        });
      }
    }
  };
  screenIsLoadedWithOcr({
    callBack: (mode) => {
      console.log(mode, "开始初始化");
      if (mode === "firstEnterChooseDetailScreen") {
        init && init();
        return;
      } else {
        console.log("初始化失败", mode);
        initBuyMethod();
      }
    },
    firstEnterChooseDetailScreen: true,
  });
  //
}

// 初始化选择规格
const patchSpecification = (callBack) => {
  const run = (point) => {
    click(point.x, point.y);
    callBack();
  };

  if (config.sixMode) {
    console.log("选择了6个盲盒");
    returnPoint({
      tmpPath: liugePath,
      callBack: (point) => {
        run(point);
      },
      timeOut: () => {
        config.sixMode = false;
        callBack();
      },
    });
  } else if (config.singleMode) {
    console.log("选择了1个盲盒");
    returnPoint({
      tmpPath: dangePath,
      callBack: (point) => {
        run(point);
      },
      timeOut: () => {
        config.singleMode = false;
        callBack();
      },
    });
  } else {
    // 什么都没有选择
    callBack();
  }
};

// 获取购买方式的按钮对于的point
const getBuyBtnsPoint = ({ callBack }) => {
  if (state.sendToHomePoint && state.goMarkGetPoint) {
    callBack({
      sendToHomeBtnPoint: state.sendToHomePoint,
      goToMarkBtnPoint: state.goMarkGetPoint,
    });
  }
  if (state.sendToHomePoint && !state.goMarkGetPoint) {
    returnPoint({
      tmpPath: daodianquPath,
      callBack: (goToMarkBtnPoint) => {
        state.goMarkGetPoint = goToMarkBtnPoint;
        callBack({
          sendToHomeBtnPoint: state.sendToHomePoint,
          goToMarkBtnPoint,
        });
      },
    });
  }
  if (!state.sendToHomePoint && state.goMarkGetPoint) {
    returnPoint({
      tmpPath: songdaojiaPath,
      callBack: (sendToHomeBtnPoint) => {
        state.sendToHomePoint = sendToHomeBtnPoint;
        callBack({
          sendToHomeBtnPoint,
          goToMarkBtnPoint: state.goMarkGetPoint,
        });
      },
    });
  }
  if (!state.sendToHomePoint && !state.goMarkGetPoint) {
    returnPoint({
      tmpPath: songdaojiaPath,
      callBack: (sendToHomeBtnPoint) => {
        state.sendToHomePoint = sendToHomeBtnPoint;
        returnPoint({
          tmpPath: daodianquPath,
          callBack: (goToMarkBtnPoint) => {
            state.goMarkGetPoint = goToMarkBtnPoint;
            callBack({ sendToHomeBtnPoint, goToMarkBtnPoint });
          },
        });
      },
    });
  }
};

function handleBuyMethod() {
  screenIsLoadedWithOcr({
    callBack: (mode) => {
      console.log(mode, "是否有商品 且是想要抢购的购买方式");
      if (mode === "hasProd") {
        console.log(
          "刷到了 现在 开始进行循环点击 确认-就是这家-我知道了-确认 模式"
        );
        console.log("存在确定按钮，存在便点击进入确认信息页面");
        clickSureBtnWhenHasProd();
      }
      // 没货 继续刷新
      if (mode === "noProd") {
        console.log("没有库存，继续循环刷新");
        getBuyBtnsPoint({
          callBack: ({ sendToHomeBtnPoint, goToMarkBtnPoint }) => {
            // 没有库存 开始循环点击 送到家 --- 到店取
            console.log(
              state.buyMethod,
              { sendToHomeBtnPoint, goToMarkBtnPoint },
              "循环时当前的购买方式,以及节点信息"
            );
            if (state.buyMethod === "mark") {
              state.buyMethod = "home";
              click(sendToHomeBtnPoint.x, sendToHomeBtnPoint.y);
              sleepForLessFetch();
              handleBuyMethod();
            }
            if (state.buyMethod === "home") {
              state.buyMethod = "mark";
              click(goToMarkBtnPoint.x, goToMarkBtnPoint.y);
              sleepForLessFetch();
              handleBuyMethod();
            }
          },
        });
      }
    },
  });
}

function clickSureBtnWhenHasProd() {
  state.loopCount++;
  console.log("循环的次数", state.loopCount);
  const run = (point) => {
    console.log("确定按钮point", point);
    state.surePoint = point;
    click(point.x, point.y);
    handleToPayLoop();
  };
  if (state.surePoint) {
    run(state.surePoint);
  }
  if (!state.surePoint) {
    returnPoint({
      tmpPath: surePath,
      callBack: (point) => {
        run(point);
      },
    });
  }
}

// 确认信息并支付 并开启循环模式
function handleToPayLoop() {
  state.enterSureLoop = true; // 是否进入循环  只要第一次点击了确认按钮  就认为进入循环
  console.log("等待确认订单页面加载...", state.enterSureLoop);
  sleepForLessFetch();
  // 等待页面加载完成
  screenIsLoadedWithOcr({
    callBack: (mode) => {
      console.log(mode, "确认信息");
      // 确认信息并支付 按钮
      if (mode === "makeSureOrder") {
        handleSureInfoAndPay();
      }
      // 确认门店信息
      if (mode === "thisOne") {
        handleSureMark();
      }
      // 确认邮寄地址信息
      if (mode === "sureMail") {
        handleSureMail();
      }
      // 没货 点击我知道了
      if (mode === "known") {
        handleSureTryAgain();
      }
      // 没货 点击我知道了
      if (mode === "nextLoopStart") {
        clickSureBtnWhenHasProd();
      }
    },
  });
}

// 确认信息并支付  循环第一步
function handleSureInfoAndPay() {
  const run = (point) => {
    state.sureInfoAndPayPoint = point;
    press(point.x, point.y, 1);
    handleToPayLoop();
  };
  if (state.sureInfoAndPayPoint) {
    run(state.sureInfoAndPayPoint);
  } else {
    returnPoint({
      tmpPath: surepayinfoPath,
      callBack: (point) => {
        run(point);
      },
      timeOut: () => {
        className("android.widget.TextView")
          .text("确认信息并支付")
          .findOne()
          .click();
      },
    });
  }
}

// 确认门店信息 循环第二步  门店模式
function handleSureMark() {
  const run = (point) => {
    state.thisMarkPoint = point;
    console.log("就是这家门店", point);
    press(point.x, point.y, 1);
    handleToPayLoop();
  };
  if (state.thisMarkPoint) {
    run(state.thisMarkPoint);
  } else {
    returnPoint({
      tmpPath: thisonePath,
      callBack: (point) => {
        run(point);
      },
      timeOut: () => {
        press(
          originPoint.originThisMarkPoint.x,
          originPoint.originThisMarkPoint.y,
          1
        );
      },
    });
  }
}

// 确认邮寄地址信息  循环第二步 邮寄模式
function handleSureMail() {
  const run = (point) => {
    state.knowMailPoint = point;
    console.log("请确认收货信息", point);
    press(point.x, point.y, 1);
    handleToPayLoop();
  };
  if (state.knowMailPoint) {
    run(state.knowMailPoint);
  } else {
    returnPoint({
      tmpPath: querenwuwuPath,
      callBack: (point) => {
        run(point);
      },
      timeOut: () => {
        press(
          originPoint.originknowMailPoint.x,
          originPoint.originknowMailPoint.y,
          1
        );
      },
    });
  }
}

// 判断是否有货 如果没货 点击我知道了  循环第一步
// 两种形式  手动点击 / 自动跳转（一定时间内不点击会自动跳回选择规格页面）
function handleSureTryAgain() {
  const run = (point) => {
    state.noProdPoint = point;
    console.log("没货点击我知道了", point, state.noProdPoint);
    press(point.x, point.y, 1);
    handleToPayLoop();
  };
  if (state.noProdPoint) {
    run(state.noProdPoint);
  } else {
    returnPoint({
      tmpPath: wozhidaolePath,
      callBack: (point) => {
        run(point);
      },
      timeOut: () => {
        press(
          originPoint.originNoProdPoint.x,
          originPoint.originNoProdPoint.y,
          1
        );
      },
    });
  }
}

// 获取对应point findImage有内存溢出问题 需要控制调用该方法的次数
function getImagePoint({ tmpPath }) {
  const img = captureScreen();
  const temp = images.read(tmpPath);
  if (!temp) {
    return null;
  }
  const jpgPathArr = tmpPath.split("/");
  const consolePath = jpgPathArr[jpgPathArr.length - 1];
  //截图并找图
  let p = null;
  try {
    p = findImage(img, temp, {
      threshold: 0.4, // 相似度0.8
    });
  } catch (err) {
    console.log(err, "err");
  } finally {
    console.log(p, consolePath);
    temp.recycle();
    img.recycle();
    if (p) {
      return p;
    } else {
      console.log("没有找到对应按钮:", consolePath);
      return null;
    }
  }
}

// 返回weight point
const returnPoint = ({ tmpPath, callBack, timeOut }) => {
  wait(
    () => {
      const point = getImagePoint({ tmpPath });
      return !!point && point;
    },
    {
      then(point) {
        console.log(`point是: ${point}`);
        callBack(point);
        return point;
      },
      else() {
        console.log(`超时: ${tmpPath}`);
        timeOut && timeOut(null);
        return null;
      },
    }
  );
};

// 调用此方法不会影响抢购流程 仅为了控制请求频率
const sleepForLessFetch = () => {
  if (config.frequency === "IMMEDIATE") {
    sleep(20);
  }
  if (config.frequency === "VERY_FAST") {
    sleep(20, 130);
  }
  if (config.frequency === "FAST") {
    sleep(130, 230);
  }
  if (config.frequency === "NORMAL") {
    sleep(230, 500);
  }
  if (config.frequency === "SLOW") {
    sleep(500, 860);
  }
  if (config.frequency === "VERY_SLOW") {
    sleep(860, 1500);
  }
};

const screenIsLoadedWithOcr = ({ callBack, firstEnterChooseDetailScreen }) => {
  const currentScreenOcr = handleoOrcScreen();
  const productInfoScreen = currentScreenOcr.includes("购物车");
  const chooseDetailScreen = currentScreenOcr.includes("购买方式");
  const makeSureOrderScreen = currentScreenOcr.some((item) =>
    item.includes("确认信息")
  );
  console.log("当前orc 确认的页面是", {
    productInfoScreen,
    chooseDetailScreen,
    makeSureOrderScreen,
  });
  // 购物车  初始页面
  if (productInfoScreen) {
    // 有购物车模式
    if (
      currentScreenOcr.includes("加入购物车") &&
      currentScreenOcr.includes("立即购买")
    ) {
      callBack("quickBuyWithCar");
    }
    // 无购物车模式
    if (
      !currentScreenOcr.includes("加入购物车") &&
      currentScreenOcr.includes("立即购买")
    ) {
      callBack("quickBuyWithoutCar");
    }
    return;
  }
  // 选择规格页面
  if (chooseDetailScreen) {
    // 有货 可以点击购买
    console.log(
      currentScreenOcr.includes("确定"),
      config.sendToHome,
      config.goMarkGet,
      state.buyMethod,
      "error 停止的地方",
      firstEnterChooseDetailScreen
    );
    if (firstEnterChooseDetailScreen) {
      callBack("firstEnterChooseDetailScreen");
      return;
    }
    if (currentScreenOcr.includes("确定")) {
      if (state.enterSureLoop) {
        // 正在循环中， 有确定按钮  提前判断为进行下一次循环
        callBack("nextLoopStart");
      }
      // 仅购买送到家
      if (config.sendToHome && !config.goMarkGet) {
        if (state.buyMethod === "mark") {
          callBack("noProd");
        }
        if (state.buyMethod === "home") {
          callBack("hasProd");
        }

        return;
      }
      // 仅购买到店取
      if (!config.sendToHome && config.goMarkGet) {
        if (state.buyMethod === "mark") {
          callBack("hasProd");
        }
        if (state.buyMethod === "home") {
          callBack("noProd");
        }
        return;
      }
      // 两种模式都可以
      if (config.sendToHome && config.goMarkGet) {
        callBack("hasProd");
        return;
      }

      // if (!config.sendToHome && !config.goMarkGet) {
      //   console.log("3333");
      //   callBack("noProd");

      //   return;
      // }
      console.log("end 没有匹配上任何模式 导致 脚本停止了");
      return;
    }

    // 没货 开始循环点击刷新
    if (
      currentScreenOcr.includes("已售罄") ||
      !currentScreenOcr.includes("确定")
    ) {
      callBack("noProd");
    }

    return;
  }

  // 确认订单页面
  if (makeSureOrderScreen) {
    // 确认门店
    if (currentScreenOcr.includes("就是这家")) {
      callBack("thisOne");
    }
    // 确认门店
    if (currentScreenOcr.includes("确认无误")) {
      callBack("sureMail");
    }
    // 我知道了
    if (currentScreenOcr.includes("我知道了")) {
      callBack("known");
    }

    // 确认信息
    if (
      !currentScreenOcr.includes("就是这家") ||
      !currentScreenOcr.includes("我知道了") ||
      !currentScreenOcr.includes("确认无误")
    ) {
      callBack("makeSureOrder");
    }

    return;
  }

  console.log("----------------需要进行兜底吗？");
  !firstEnterChooseDetailScreen && device.vibrate(3000); //手机震动5秒 可能抢到了
  // 兜底逻辑
  sleep(config.orcSleepTime);
  screenIsLoadedWithOcr({ callBack, firstEnterChooseDetailScreen });
  return;
};

const handleoOrcScreen = () => {
  sleep(config.orcSleepTime); // 绝不能删除  不然orc需要一定时间 机型不同 时间会有所差异
  let img = images.captureScreen();
  const region = [0, 0.2, -1, 0.6];
  const currentScreenOcr = ocr(img, region);
  // console.log("ocr----", currentScreenOcr);
  img.recycle();
  return currentScreenOcr;
};

const testBtnInfo = (text) => {
  if (!text) {
    console.log("没有需要寻找的按钮输入", text);
    return;
  }
  console.log("开始寻找按钮信息");
  const cur = className("android.widget.TextView").text(text).findOne();
  console.log(text, "当前按钮信息", cur);
};

// 判断按钮信息是否存在
function getCoordinates(key) {
  const target = originPoint[key];
  if (target && typeof target.x === "number" && typeof target.y === "number") {
    return target;
  }
  return null;
}

function patchOriginPointToImagePoint() {
  state.sixModePoint = getCoordinates("originSixModePoint");
  state.singleModePoint = getCoordinates("originSingleModePoint");
  state.sendToHomePoint = getCoordinates("originSendToHomePoint");
  state.goMarkGetPoint = getCoordinates("originGoMarkGetPoint");
  state.acountAddPoint = getCoordinates("originAcountAddPoint");
  state.quickBtnPointWithOutCarPoint = getCoordinates(
    "originalQuickBtnPointWithOutCarPoint"
  );
  state.quickBtnPointWithCarPoint = getCoordinates(
    "originalQuickBtnPointWithCarPoint"
  );
  state.surePoint = getCoordinates("originSurePoint");
  state.thisMarkPoint = getCoordinates("originThisMarkPoint");
  state.noProdPoint = getCoordinates("originNoProdPoint");
  state.knowMailPoint = getCoordinates("originknowMailPoint");
  state.sureInfoAndPayPoint = getCoordinates("originSureInfoAndPayPoint");
}

// 执行函数
start();
