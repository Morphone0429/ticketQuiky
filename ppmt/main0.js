let main = () => {
  let state = {
    initBuyConfig: false, // 初始化规格
    buyMethod: "home", // home | mark
    enterSureLoop: false,
    loopCount: 0,
    hasClickQuickBuy: false,
    currentScreenOcr: [],
    isFirstEnterChooseDetailScreen: false,
    popLoadingStartTime: null,
    sureBtnShowTime: null,
  };
  requestScreenCapture();
  startToBuy();
  // 开始脚本任务 判断当前页面 并进入对应页面的流程工作
  function startToBuy() {
    console.log("脚本开始执行");
    console.log("当前用户设置的初始化购买配置", { config, state });
    threads.start(function () {
      let i = 0;
      // 直到进入选择规格/购买方式页面才停止该线程
      while (true) {
        i++;
        let currentScreenOcr = handleoOrcScreen(1);
        let {
          hasQuickBuyBtn,
          quickBuyScreen,
          hasQuickBuyErrorBtn,
          chooseDetailScreen,
          markListScreen,
          makeSureOrderScreen,
        } = patchScreen(currentScreenOcr);
        // 进入选择规格/购买方式页面  break
        if (chooseDetailScreen) {
          state.hasClickQuickBuy = false;
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
        // 误点进入自提门店列表页面 马上退出
        if (markListScreen) {
          backToPreScreen();
        }
        // 监听到有立即购买按钮点击
        if (hasQuickBuyBtn && quickBuyScreen) {
          initQuickBuy(currentScreenOcr);
        }
        // 距离开售时间还剩 00:00
        if (hasQuickBuyErrorBtn && quickBuyScreen) {
          waitForSureBtn();
        }
      }
    });
  }

  // 立即购买页面/预售倒计时页面
  function initQuickBuy(currentScreenOcr) {
    // 防止进入选择规则页面的瞬间重复点击
    if (state.hasClickQuickBuy) return;
    // 有购物车模式
    if (currentScreenOcr.includes("加入购物车")) {
      state.hasClickQuickBuy = true;
      console.log(
        point.originalQuickBtnPointWithCarPoint.x,
        point.originalQuickBtnPointWithCarPoint.y
      );
      simulateClick(
        point.originalQuickBtnPointWithCarPoint.x,
        point.originalQuickBtnPointWithCarPoint.y
      );
    }
    // 无购物车模式
    if (!currentScreenOcr.includes("加入购物车")) {
      state.hasClickQuickBuy = true;
      simulateClick(
        point.originalQuickBtnPointWithOutCarPoint.x,
        point.originalQuickBtnPointWithOutCarPoint.y
      );
    }
    setTimeout(() => {
      if (state.hasClickQuickBuy) {
        state.hasClickQuickBuy = false;
      }
    }, 1000);
  }

  // 预售时确定按钮不一定能刷新 会停留在 00:00  需要手动下滑
  function waitForSureBtn() {
    let MAX_WAIT_TIME = 1500;
    if (!state.sureBtnShowTime) {
      state.sureBtnShowTime = Date.now();
    }
    let elapsedTime = Date.now() - state.sureBtnShowTime;
    if (elapsedTime >= MAX_WAIT_TIME) {
      state.sureBtnShowTime = null;
      trySwipeUp();
    }
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
          simulateClick(point.originSixModePoint.x, point.originSixModePoint.y);
        } else if (config.singleMode) {
          console.log("选择了1个盲盒", point.originSingleModePoint);
          simulateClick(
            point.originSingleModePoint.x,
            point.originSingleModePoint.y
          );
        }
        state.buyMethod = buyMethod;
        simulateClick(_point.x, _point.y);
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

  function handleAmount() {
    let currentScreenOcr = state.currentScreenOcr;
    // oppo reno5 教量识图为教量
    let index =
      currentScreenOcr.indexOf("数量") !== -1
        ? currentScreenOcr.indexOf("数量")
        : currentScreenOcr.indexOf("教量");
    let newScreenOcr =
      index !== -1 ? currentScreenOcr.slice(index + 1) : currentScreenOcr;
    let hasAdd =
      newScreenOcr.some((item) => item.includes("2")) ||
      newScreenOcr.includes("2");
    if (config.addOne && !hasAdd) {
      simulateClick(point.originAcountAddPoint.x, point.originAcountAddPoint.y);
      sleep(50);
    } else if (!config.addOne && hasAdd) {
      simulateClick(
        point.originAcountLessPoint.x,
        point.originAcountLessPoint.y
      );
      sleep(50);
    }
  }

  function handleBuyMethod() {
    // let isFlag = fastClickSureBtn();
    // if (isFlag) return;
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
          let newScreenOcr = handleoOrcScreen(1);
          if (newScreenOcr.includes("确定")) {
            handleAmount(); //判断是否进行 +1 操作
            clickSureBtnWhenHasProd();
          } else {
            handleBuyMethod();
          }
        }
        // 没货 继续刷新
        if (mode === "noProd") {
          let currentBuyMethod = state.buyMethod;
          console.log("没有库存，继续循环刷新");
          if (currentBuyMethod === "mark") {
            state.buyMethod = "home";
            simulateClick(
              point.originSendToHomePoint.x,
              point.originSendToHomePoint.y
            );
            // config.sendToHome && sleepForLessFetch();
            // handleBuyMethod();

            checkSureBtnLoading({
              then: handleBuyMethod,
              skip: config.goMarkGet,
            });
          }
          if (currentBuyMethod === "home") {
            state.buyMethod = "mark";
            simulateClick(
              point.originGoMarkGetPoint.x,
              point.originGoMarkGetPoint.y
            );
            // config.goMarkGet && sleepForLessFetch();
            // handleBuyMethod();

            checkSureBtnLoading({
              then: handleBuyMethod,
              skip: config.sendToHome,
            });
          }
        }
      },
      patchStep: "chooseDetail",
    });
  }

  function checkSureBtnLoading({ then, skip }) {
    //TODO 卡bug 进寄到家确认信息页面
    if (skip) {
      then();
    } else {
      let MAX_WAIT_TIME = 2000;
      if (!state.sureBtnShowTime) {
        state.sureBtnShowTime = Date.now();
      }
      let elapsedTime = Date.now() - state.sureBtnShowTime;

      if (elapsedTime >= MAX_WAIT_TIME) {
        state.sureBtnShowTime = null;
        then();
      }
      let newScreenOcr = handleoOrcScreen(1);
      if (
        newScreenOcr.includes("确定") ||
        newScreenOcr.includes("已售罄") ||
        newScreenOcr.includes("选择门店")
      ) {
        state.sureBtnShowTime = null;
        then();
      } else {
        checkSureBtnLoading({ then, skip });
      }
    }
  }

  // 模拟点击
  function simulateClick(x, y, wait) {
    if (!x || !y) return;
    let _random = random(1, 11);
    let isEven = _random % 2 === 0;
    let _x = random(x[0], x[1]);
    let _y = random(y[0], y[1]);
    if (isEven) {
      let _randomDuration = random(20, 220) || 150;
      press(_x, _y, _randomDuration);
    } else {
      click(_x, _y);
    }
  }

  // 第一次进入选择规格页面时，马上判断是否已经有确认按钮 如果存在，不进行
  function fastClickSureBtn() {
    // 判断是否已经存在确定按钮
    if (state.isFirstEnterChooseDetailScreen) return false;
    state.isFirstEnterChooseDetailScreen = true;
    if (!state.currentScreenOcr.includes("确定")) return false;
    handleAmount(); //判断是否进行 数量增加/减少 操作
    clickSureBtnWhenHasProd();
    return true;
  }

  function clickSureBtnWhenHasProd() {
    state.loopCount++;
    console.log("循环的次数", state.loopCount);
    simulateClick(point.originSurePoint.x, point.originSurePoint.y);
    handleToPayLoop();
  }

  // 确认信息并支付 并开启循环模式
  function handleToPayLoop() {
    state.enterSureLoop = true; // 是否进入循环  只要第一次点击了确认按钮  就认为进入循环
    console.log("等待确认订单页面加载...");
    console.log("是否进入循环", state.enterSureLoop);
    // TODO:
    sleepForLessFetch();
    // 等待页面加载完成
    screenIsLoadedWithOcr({
      patchStep: "makeSureOrder",
      // _wait: 50,
      callBack: (mode) => {
        console.log(mode, "确认信息");
        // 确认信息并支付 按钮
        if (mode === "makeSureOrder") {
          let currentScreenOcr = state.currentScreenOcr;
          sleepWhenTryAgianShow({
            currentScreenOcr,
            then: () => {
              let newScreenOcr = handleoOrcScreen(1);
              let { POPMARTLoading } = patchScreen(newScreenOcr);
              let isTimeOut = checkPOPLoading({ POPMARTLoading });
              if (POPMARTLoading) {
                if (isTimeOut) {
                  backToPreScreen();
                  sleep(200);
                  handleToPayLoop();
                } else {
                  handleToPayLoop();
                }
              } else {
                simulateClick(
                  point.originSureInfoAndPayPoint.x,
                  point.originSureInfoAndPayPoint.y
                );
                handleToPayLoop();
              }
            },
          });
        }
        // 确认门店信息
        if (mode === "thisOne") {
          simulateClick(
            point.originThisMarkPoint.x,
            point.originThisMarkPoint.y
          );
          sleep(config.orcSleepTime);
          handleToPayLoop();
        }
        // 确认邮寄地址信息
        if (mode === "sureMail") {
          simulateClick(
            point.originknowMailPoint.x,
            point.originknowMailPoint.y
          );
          sleep(config.orcSleepTime);
          handleToPayLoop();
        }
        // 判断是否有货 如果没货 点击我知道了  循环第一步
        // 两种形式  手动点击 / 自动跳转（一定时间内不点击会自动跳回选择规格页面）
        if (mode === "known") {
          simulateClick(point.originNoProdPoint.x, point.originNoProdPoint.y);
          handleToPayLoop();
        }
        // 没货 点击我知道了
        if (mode === "nextLoopStart") {
          handleAmount();
          clickSureBtnWhenHasProd();
        }
        // 抢到了 自动付款
        if (mode === "toPay") {
          device.vibrate(1500);
          sleep(6000);
          let payPoints = point.originPayPoints;
          for (let i = 0; i < payPoints.length; i++) {
            let _point = payPoints[i];
            simulateClick(_point.x, _point.y);
            sleep(1000);
          }
        }
      },
    });
  }

  function checkPOPLoading({ POPMARTLoading }) {
    // 等待 loading 元素出现的最大时间（毫秒）
    let MAX_WAIT_TIME = 5000;
    if (!POPMARTLoading) return false;
    if (!state.popLoadingStartTime) {
      state.popLoadingStartTime = Date.now();
    }
    let elapsedTime = Date.now() - state.popLoadingStartTime;
    // loading是否超时
    if (elapsedTime >= MAX_WAIT_TIME) {
      state.popLoadingStartTime = null;
      return true;
    } else {
      return false;
    }
  }

  function sleepWhenTryAgianShow({ currentScreenOcr, then }) {
    let hasTrySoon = currentScreenOcr.some((item) =>
      item.includes("请稍后重试")
    );
    if (!hasTrySoon) {
      then();
    } else {
      let newScreenOcr = handleoOrcScreen(1500);
      sleepWhenTryAgianShow({ currentScreenOcr: newScreenOcr, then });
    }
  }

  function backToPreScreen() {
    let { markListScreen, makeSureOrderScreen } = patchScreen(
      state.currentScreenOcr
    );
    if (!markListScreen || !makeSureOrderScreen) return;
    simulateClick(point.originBackScreenPoint.x, point.originBackScreenPoint.y);
  }

  // 调用此方法不会影响抢购流程 仅为了控制请求频率
  function sleepForLessFetch(wait) {
    if (wait) {
      sleep(wait);
      return;
    }
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
    let hasQuickBuyErrorBtn = currentScreenOcr.some((item) =>
      item.includes("00")
    );
    let POPMARTLoading = currentScreenOcr.some((item) => item.includes("POP")); //popmark 红色loading
    return {
      quickBuyScreen,
      chooseDetailScreen,
      makeSureOrderScreen,
      hasQuickBuyBtn,
      hasQuickBuyErrorBtn,
      markListScreen,
      POPMARTLoading,
    };
  }

  function screenIsLoadedWithOcr({ callBack, patchStep, _wait }) {
    let wait = _wait ? _wait : 0;
    let currentScreenOcr = handleoOrcScreen(wait);
    let {
      quickBuyScreen,
      chooseDetailScreen,
      makeSureOrderScreen,
      markListScreen,
    } = patchScreen(currentScreenOcr);
    // 兜底逻辑 需要
    function fallbackLogic() {
      console.log("兜底逻辑=====================");
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
      backToPreScreen();
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
        if (
          currentScreenOcr.includes("确认无误") ||
          currentScreenOcr.some((item) => item.includes("无误"))
        ) {
          callBack("sureMail");
          return;
        }
        // 我知道了
        if (
          currentScreenOcr.includes("我知道了") ||
          currentScreenOcr.some((item) => item.includes("道了"))
        ) {
          callBack("known");
          return;
        }

        // 付款页面
        if (currentScreenOcr.includes("微信支付")) {
          callBack("toPay");
          return;
        }
        // console.log(currentScreenOcr, "currentScreenOcr");
        // 确认信息
        if (
          !currentScreenOcr.includes("就是这家") ||
          !currentScreenOcr.includes("我知道了") ||
          !currentScreenOcr.some((item) => item.includes("道了")) ||
          !currentScreenOcr.includes("确认无误") ||
          !currentScreenOcr.some((item) => item.includes("无误")) ||
          !currentScreenOcr.includes("微信支付")
        ) {
          callBack("makeSureOrder");
          return;
        }
      }
      // console.log(currentScreenOcr, "currentScreenOcr");
    }

    fallbackLogic();
  }

  function handleoOrcScreen(wait) {
    let _wait = wait ? wait : config.orcSleepTime;
    sleep(_wait); // 绝不能删除  不然orc需要一定时间 机型不同 时间会有所差异
    let img = images.captureScreen();
    let region = [0, 0.2, -1, 0.6];
    let currentScreenOcr = ocr(img, region);
    state.currentScreenOcr = currentScreenOcr;
    // console.log("ocr----", { currentScreenOcr, state: currentScreenOcr });
    img.recycle();
    return currentScreenOcr;
  }

  // 下滑屏幕 用于刷新
  function trySwipeUp() {
    // 获取屏幕尺寸
    let width = device.width;
    let height = device.height;
    // 设置下拉起始点和结束点（从屏幕中部向下滑动）
    let startX = width / 2;
    let startY = height / 2;
    let endY = startY + 800; // 下拉距离，可根据需要调整
    // 执行下拉手势
    gesture(1000, [startX, startY], [startX, endY]);
    // 等待刷新完成（时间可根据实际情况调整）
    // sleep(3000);
  }
};

module.exports = {
  main,
};
