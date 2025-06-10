let main = () => {
  let state = {
    buyMethod: "", // home | mark
    enterSureLoop: false,
    loopCount: 0,
    clickDisabled: false,
    currentScreenOcr: [],
    isFirstEnterChooseDetailScreen: false,
    popLoadingStartTime: null,
    // sureBtnShowTime: null,
    loadingTime: null,
  };
  //
  requestScreenCapture();
  console.log("脚本开始执行,购买配置:", { config, state });
  run();
  function run() {
    screenIsLoadedWithOcr({
      callBack: (mode) => {
        if (mode === "quickBuyWithCar") {
          handleSimulateClick({
            x: point.originalQuickBtnPointWithCarPoint.x,
            y: point.originalQuickBtnPointWithCarPoint.y,
          });
          run();
        }
        if (mode === "quickBuyWithoutCar") {
          handleSimulateClick({
            x: point.originalQuickBtnPointWithOutCarPoint.x,
            y: point.originalQuickBtnPointWithOutCarPoint.y,
          });
          run();
        }
        if (mode === "quickBuyError") {
          //预售时确定按钮不一定能刷新 会停留在 00:00  需要手动下滑
          waitForFn({ maxWaitTime: 1500, callBack: utils.trySwipeUp });
          run();
        }
        if (mode === "loopChooseDetail") {
          initBuyMethod();
        }
        if (mode === "loopMakeSureOrder") {
          handleToPayLoop();
        }
        if (mode === "loopMarkList") {
          backToPreScreen();
          run();
        }
      },
      patchStep: "start",
      wait: 1,
    });
  }

  //初始化购买配置页面
  function initBuyMethod() {
    let run = ({ _point, buyMethod }) => {
      //有规格选项 先选择规格
      if (config.sixMode) {
        handleSimulateClick({
          x: point.originSixModePoint.x,
          y: point.originSixModePoint.y,
          unobstructed: true,
        });
      } else if (config.singleMode) {
        handleSimulateClick({
          x: point.originSingleModePoint.x,
          y: point.originSingleModePoint.y,
          unobstructed: true,
        });
      }
      state.buyMethod = buyMethod;
      handleSimulateClick({ x: _point.x, y: _point.y, unobstructed: true });

      waitForFn({ maxWaitTime: 600, callBack: handleBuyMethod });
      // handleBuyMethod();
    };

    // 送到家
    if (config.sendToHome && !config.goMarkGet) {
      run({ _point: point.originSendToHomePoint, buyMethod: "home" });
    }

    // 到店取
    if (!config.sendToHome && config.goMarkGet) {
      run({ _point: point.originGoMarkGetPoint, buyMethod: "mark" });
    }
  }

  function handleBuyMethod() {
    // return
    screenIsLoadedWithOcr({
      callBack: (mode) => {
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

  // 预售时确定按钮不一定能刷新 会停留在 00:00  需要手动下滑
  function waitForFn({ maxWaitTime, callBack }) {
    let MAX_WAIT_TIME = maxWaitTime;
    if (!state.loadingTime) {
      state.loadingTime = Date.now();
    }
    let elapsedTime = Date.now() - state.loadingTime;
    if (elapsedTime >= MAX_WAIT_TIME) {
      state.loadingTime = null;
      callBack();
    }
    setTimeout(() => {
      state.loadingTime = null;
    }, maxWaitTime);
  }

  // 模拟点击  unobstructed true 不设置clickDisabled
  function handleSimulateClick({ x, y, wait, unobstructed }) {
    if (unobstructed) {
      utils.simulateClick(x, y, wait);
    } else {
      if (state.clickDisabled) return;
      utils.simulateClick(x, y, wait);
      state.clickDisabled = true;
      setTimeout(() => {
        state.clickDisabled = false;
      }, 600);
    }
  }

  function screenIsLoadedWithOcr({ callBack, patchStep, wait }) {
    let _wait = wait ? wait : 0;
    let currentScreenOcr = handleoOrcScreen(_wait);
    let {
      hasQuickBuyBtn,
      hasQuickBuyErrorBtn,
      hasAddCar,
      quickBuyScreen, // 立即购买按钮页面
      chooseDetailScreen, // 选择规格，购买方式页面
      makeSureOrderScreen, // 确认信息并支付页面
      markListScreen, // 自提门店列表页面
    } = utils.patchScreen({ currentScreenOcr });

    function fallbackLogic() {
      // 兜底逻辑 没有找到 再多等待一会儿再查找

      screenIsLoadedWithOcr({ callBack, patchStep, wait });
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

    if (patchStep === "start") {
      // 购物车y页面
      if (quickBuyScreen) {
        // 有购物车模式
        if (hasAddCar && hasQuickBuyBtn) {
          callBack("quickBuyWithCar");
          return;
        }
        // 无购物车模式
        if (!hasAddCar && hasQuickBuyBtn) {
          callBack("quickBuyWithoutCar");
          return;
        }
        // 距离开售时间还剩 00:00 异常情况
        if (hasQuickBuyErrorBtn) {
          callBack("quickBuyError");
          return;
        }
      }
      // 进入选择规格/购买方式页面
      if (chooseDetailScreen) {
        callBack("loopChooseDetail");
        return;
      }
      // 确认信息页面
      if (makeSureOrderScreen) {
        callBack("loopMakeSureOrder");
        return;
      }
      // 误点进入自提门店列表页面 马上退出
      if (markListScreen) {
        callBack("loopMarkList");
        return;
      }
    }

    // 选择规格页面
    if (patchStep === "chooseDetail") {
      if (chooseDetailScreen) {
        // 有货 可以点击购买
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
    let { currentScreenOcr, elapsedTime, startTime, generateId, endTime } =
      utils.getOrcScreen();
    state.currentScreenOcr = currentScreenOcr;
    state.generateId = generateId;
    sleep(_wait);
    return { currentScreenOcr, elapsedTime, startTime, generateId, endTime };
  }
};

module.exports = {
  main,
};
