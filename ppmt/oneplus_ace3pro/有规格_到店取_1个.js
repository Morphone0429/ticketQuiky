auto();
/***
   * 刷新频率 frequency  默认NORMAL
   *  
    IMMEDIATE     // 立即执行 20ms
    VERY_FAST   // 快速更新 20-130ms毫秒随机
    FAST        // 较快更新 130-230ms毫秒随机
    NORMAL      // 标准间隔 230-500ms毫秒随机
    SLOW     // 较慢更新 500-860ms毫秒随机
    VERY_SLOW  // 慢速更新 860-1500ms毫秒随机
   */
let config = {
  frequency: "NORMAL",
  singleMode: true,
  sixMode: false,
  sendToHome: false,
  goMarkGet: true,
  orcSleepTime: 200,
};

let onePlus_ace_3_pro_device = {
  width: 1264,
  height: 2780,
};

// 真机按钮 信息
let point = {
  //  按钮信息 ------start ------
  originSixModePoint: { x: 694.5, y: 1258 }, // 单个盲盒随机发货 ojbk
  originSingleModePoint: { x: 257, y: 1258 }, // 整盒含6个盲盒 ojbk
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
  originNoProdPoint: { x: 631.5, y: 1468.5 }, // 没货提示 <我知道了>按钮  ojbk
  originknowMailPoint: { x: 631.5, y: 1716.0 }, // 请确认收货地址  确认无误按钮  ojbk
  originSureInfoAndPayPoint: { x: 980, y: 2627.0 }, //确认订单页面 确认信息并支付 ojbk
  originBackScreenPoint: { x: 75, y: 214.0 },
  //  按钮信息 ------end -----
};

let state = {
  initBuyConfig: false, // 初始化规格
  buyMethod: "home", // home | mark
  enterSureLoop: false,
  loopCount: 0,
};

let main = () => {
  requestScreenCapture();
  startToBuy(); // 寻找立即购买按钮

  // 查找立即购买按钮 存在便点击
  function startToBuy() {
    console.log("程序开始执行");
    console.log("当前用户设置的初始化购买配置", { config, state });
    console.log("查找立即购买按钮");
    threads.start(function () {
      log("刷新确定按钮自动点击线程已启动");
      let i = 0;
      // 直到进入选择规格/购买方式页面才停止该线程
      while (true) {
        i++;
        let currentScreenOcr = handleoOrcScreen(100);
        let {
          hasQuickBuyBtn,
          quickBuyScreen,
          chooseDetailScreen,
          markListScreen,
          makeSureOrderScreen,
        } = patchScreen(currentScreenOcr);

        console.log(
          "立即购买,即将进入选择规格和购买方式页面",
          i,
          currentScreenOcr,
          hasQuickBuyBtn,
          quickBuyScreen,
          chooseDetailScreen,
          makeSureOrderScreen
        );
        // 进入选择规格/购买方式页面  break
        if (chooseDetailScreen) {
          console.log("进入购买页面，开始初始化购买配置，并打断当前子线程");
          initBuyMethod(); //初始化购买配置页面
          break;
        }
        // 确认信息页面
        if (makeSureOrderScreen) {
          console.log("开始确认订单循环，并打断当前子线程");
          handleToPayLoop();
          break;
        }
        // 误点进入自提门店列表页面 马上退出F
        if (markListScreen) {
          click(point.originBackScreenPoint);
        }
        // 监听到有立即购买按钮  点击
        if (hasQuickBuyBtn && quickBuyScreen) {
          // 有购物车模式
          if (currentScreenOcr.includes("加入购物车")) {
            click(point.originalQuickBtnPointWithCarPoint);
            sleep(config.orcSleepTime);
          }
          // 无购物车模式
          if (!currentScreenOcr.includes("加入购物车")) {
            click(point.originalQuickBtnPointWithOutCarPoint);
            sleep(config.orcSleepTime);
          }
        }
        // 看自行测试结果 判断是否 控制刷新频率 默认不控制
        // sleep(100);
      }
    });
  }

  //初始化购买配置页面
  function initBuyMethod() {
    function init() {
      if (state.initBuyConfig) {
        handleBuyMethod();
        return;
      }
      let run = ({ _point, buyMethod }) => {
        // 如果有规格选项 先选择规格
        if (config.sixMode) {
          console.log("选择了6个盲盒", point.originSixModePoint);
          click(point.originSixModePoint.x, point.originSixModePoint.y);
        } else if (config.singleMode) {
          console.log("选择了1个盲盒", point.originSingleModePoint);
          click(point.originSingleModePoint.x, point.originSingleModePoint.y);
        }
        state.buyMethod = buyMethod;
        click(_point.x, _point.y);
        state.initBuyConfig = true;
        handleBuyMethod();
      };

      // 仅送到家
      if (config.sendToHome && !config.goMarkGet) {
        run({ _point: point.originSendToHomePoint, buyMethod: "home" });
      }

      // 仅到店取
      // 送到家 && 到店取
      if (
        (!config.sendToHome && config.goMarkGet) ||
        (config.sendToHome && config.goMarkGet)
      ) {
        run({ _point: point.originGoMarkGetPoint, buyMethod: "mark" });
      }
    }
    init();
  }

  function handleBuyMethod() {
    screenIsLoadedWithOcr({
      callBack: (mode) => {
        console.log(
          mode,
          "是否有商品 且是想要抢购的购买方式",
          mode === "noProd" ? " 没有" : "有"
        );
        if (mode === "hasProd") {
          console.log(
            "刷到了 点击进入确认信息页面  开始进行循环点击 <确认-就是这家-我知道了-确认> 模式"
          );
          clickSureBtnWhenHasProd();
        }
        // 没货 继续刷新
        if (mode === "noProd") {
          console.log("没有库存，继续循环刷新");
          if (state.buyMethod === "mark") {
            state.buyMethod = "home";
            click(point.originSendToHomePoint.x, point.originSendToHomePoint.y);
            sleepForLessFetch(); //可优化  根据页面刷新状态
            handleBuyMethod();
          }
          if (state.buyMethod === "home") {
            state.buyMethod = "mark";
            click(point.originGoMarkGetPoint.x, point.originGoMarkGetPoint.y);
            sleepForLessFetch();
            handleBuyMethod();
          }
        }
      },
      patchStep: "chooseDetail",
    });
  }

  function clickSureBtnWhenHasProd() {
    state.loopCount++;
    console.log("循环的次数", state.loopCount);
    click(point.originSurePoint.x, point.originSurePoint.y);
    handleToPayLoop();
  }

  // 确认信息并支付 并开启循环模式
  function handleToPayLoop() {
    state.enterSureLoop = true; // 是否进入循环  只要第一次点击了确认按钮  就认为进入循环
    console.log("等待确认订单页面加载...");
    console.log("是否进入循环", state.enterSureLoop);
    sleepForLessFetch();
    // 等待页面加载完成
    screenIsLoadedWithOcr({
      patchStep: "makeSureOrder",
      callBack: (mode) => {
        console.log(mode, "确认信息");
        // 确认信息并支付 按钮
        if (mode === "makeSureOrder") {
          click(
            point.originSureInfoAndPayPoint.x,
            point.originSureInfoAndPayPoint.y
          );
          handleToPayLoop();
        }
        // 确认门店信息
        if (mode === "thisOne") {
          click(point.originThisMarkPoint.x, point.originThisMarkPoint.y);
          handleToPayLoop();
        }
        // 确认邮寄地址信息
        if (mode === "sureMail") {
          click(point.originknowMailPoint.x, point.originknowMailPoint.y);
          handleToPayLoop();
        }
        // 判断是否有货 如果没货 点击我知道了  循环第一步
        // 两种形式  手动点击 / 自动跳转（一定时间内不点击会自动跳回选择规格页面）
        if (mode === "known") {
          click(point.originNoProdPoint.x, point.originNoProdPoint.y);
          handleToPayLoop();
        }
        // 没货 点击我知道了
        if (mode === "nextLoopStart") {
          clickSureBtnWhenHasProd();
        }
      },
    });
  }

  // 调用此方法不会影响抢购流程 仅为了控制请求频率
  function sleepForLessFetch() {
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
  }

  function patchScreen(currentScreenOcr) {
    let quickBuyScreen = currentScreenOcr.includes("购物车");
    let markListScreen = currentScreenOcr.includes("自堤门店列表");
    let chooseDetailScreen = currentScreenOcr.includes("购买方式");
    let makeSureOrderScreen = currentScreenOcr.some((item) =>
      item.includes("确认信息")
    );
    let hasQuickBuyBtn = currentScreenOcr.includes("立即购买");
    return {
      quickBuyScreen,
      chooseDetailScreen,
      makeSureOrderScreen,
      hasQuickBuyBtn,
      markListScreen,
    };
  }

  function screenIsLoadedWithOcr({ callBack, patchStep, _wait }) {
    let currentScreenOcr = handleoOrcScreen();
    let {
      quickBuyScreen,
      chooseDetailScreen,
      makeSureOrderScreen,
      markListScreen,
    } = patchScreen(currentScreenOcr);
    let wait = _wait ? _wait : 0;
    // 兜底逻辑 需要
    function fallbackLogic() {
      console.log("----------------需要进行兜底吗？");
      if (patchStep === "makeSureOrder" && makeSureOrderScreen) {
        device.vibrate(200); //手机震动 可能抢到了
      }
      // 兜底逻辑 没有找到 再多等待一会儿再查找
      sleep(config.orcSleepTime + wait);
      screenIsLoadedWithOcr({ callBack, patchStep });
      return;
    }

    console.log("当前的步骤和监听到的页面是", {
      patchStep,
      quickBuyScreen,
      chooseDetailScreen,
      makeSureOrderScreen,
    });

    if (markListScreen) {
      // 误点进入自提门店列表页面 马上退出
      click(point.originBackScreenPoint);
    }

    // 匹配立即购买页面
    if (patchStep === "quickBuy") {
      // 购物车  初始页面
      if (quickBuyScreen) {
        // 有购物车模式
        if (
          currentScreenOcr.includes("加入购物车") &&
          currentScreenOcr.includes("立即购买")
        ) {
          callBack("quickBuyWithCar");
          return;
        }
        // 无购物车模式
        if (
          !currentScreenOcr.includes("加入购物车") &&
          currentScreenOcr.includes("立即购买")
        ) {
          callBack("quickBuyWithoutCar");
          return;
        }
      }
    }

    // 选择规格页面
    if (patchStep === "chooseDetail") {
      if (chooseDetailScreen) {
        // 有货 可以点击购买
        // 先选择对应的规格和购买方式
        if (!state.initBuyConfig) {
          callBack("initBuyConfig");
          return;
        }

        if (currentScreenOcr.includes("确定")) {
          // 仅购买送到家
          if (config.sendToHome && !config.goMarkGet) {
            if (state.buyMethod === "mark") {
              callBack("noProd");
              return;
            }
            if (state.buyMethod === "home") {
              callBack("hasProd");
              return;
            }
          }
          // 仅购买到店取
          if (!config.sendToHome && config.goMarkGet) {
            if (state.buyMethod === "mark") {
              callBack("hasProd");
              return;
            }
            if (state.buyMethod === "home") {
              callBack("noProd");
              return;
            }
          }

          // 两种模式都可以
          if (config.sendToHome && config.goMarkGet) {
            callBack("hasProd");
            return;
          }
        }

        // 没货 开始循环点击刷新
        if (
          currentScreenOcr.includes("已售罄") ||
          !currentScreenOcr.includes("确定")
        ) {
          callBack("noProd");
          return;
        }
      }
    }

    if (patchStep === "makeSureOrder") {
      // 正在循环中， 有确定按钮  提前判断为进行下一次循环
      if (chooseDetailScreen) {
        if (currentScreenOcr.includes("确定") && state.enterSureLoop) {
          callBack("nextLoopStart");
          return;
        }
      }

      // 确认订单页面
      if (makeSureOrderScreen) {
        // 确认门店
        if (currentScreenOcr.includes("就是这家")) {
          callBack("thisOne");
          return;
        }
        // 确认门店
        if (currentScreenOcr.includes("确认无误")) {
          callBack("sureMail");
          return;
        }
        // 我知道了
        if (currentScreenOcr.includes("我知道了")) {
          callBack("known");
          return;
        }

        // 确认信息
        if (
          !currentScreenOcr.includes("就是这家") ||
          !currentScreenOcr.includes("我知道了") ||
          !currentScreenOcr.includes("确认无误")
        ) {
          callBack("makeSureOrder");
          return;
        }
      }
      console.log(currentScreenOcr, "currentScreenOcr");
    }

    fallbackLogic();
  }

  function handleoOrcScreen(wait) {
    let _wait = wait ? wait : config.orcSleepTime;
    sleep(_wait); // 绝不能删除  不然orc需要一定时间 机型不同 时间会有所差异
    let img = images.captureScreen();
    let region = [0, 0.2, -1, 0.6];
    let currentScreenOcr = ocr(img, region);
    // console.log("ocr----", currentScreenOcr);
    img.recycle();
    return currentScreenOcr;
  }
};

main();