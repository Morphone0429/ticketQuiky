let main = () => {
  let state = {
    buyMethod: '', // home | mark
    enterSureLoop: false,
    loopCount: 0,
    clickDisabled: false,
    currentScreenOcr: [],
    loadingTime: null,
  };
  //
  requestScreenCapture();
  console.log('脚本开始执行,购买配置:', { config, state });
  run();
  function run() {
    screenIsLoadedWithOcr({
      callBack: ({ mode }) => {
        console.log({ mode }, '========mode')
        if (mode === 'quickBuyWithCar') {
          handleSimulateClick({
            x: point.originalQuickBtnPointWithCarPoint.x,
            y: point.originalQuickBtnPointWithCarPoint.y,
            disabledKey: 'originalQuickBtnPointWithCarPoint'
          });
          run();
        }
        if (mode === 'quickBuyWithoutCar') {
          handleSimulateClick({
            x: point.originalQuickBtnPointWithOutCarPoint.x,
            y: point.originalQuickBtnPointWithOutCarPoint.y,
            disabledKey: 'originalQuickBtnPointWithOutCarPoint'
          });
          run();
        }
        if (mode === 'quickBuyError') {
          //预售时确定按钮不一定能刷新 会停留在 00:00  需要手动下滑
          waitForFn({ maxWaitTime: 1500, next: utils.trySwipeUp, loadingKey: 'quickBuyErrorLoading' });
          run();
        }
        if (mode === 'loopChooseDetail') {
          initBuyMethod();
        }
        if (mode === 'loopMakeSureOrder') {
          handleToPayLoop();
        }
        if (mode === 'loopMarkList') {
          backToPreScreen();
          run();
        }
      },
      patchStep: 'start',
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
      handleSimulateClick({ x: _point.x, y: _point.y, unobstructed: true })
      let { hasSureBtn } = utils.patchScreen({ currentScreenOcr: state.currentScreenOcr })
      !hasSureBtn && sleep(200)
      checkSureBtnLoading({ then: handleBuyMethod, loadingKey: 'sureBtnLoading' });
    };

    // 送到家
    if (config.sendToHome && !config.goMarkGet) {
      run({ _point: point.originSendToHomePoint, buyMethod: 'home' });
    }

    // 到店取
    if (!config.sendToHome && config.goMarkGet) {
      run({ _point: point.originGoMarkGetPoint, buyMethod: 'mark' });
    }
  }

  function handleBuyMethod() {
    screenIsLoadedWithOcr({
      callBack: ({ mode }) => {
        if (mode === 'hasProd') {
          console.log('刷到了 点击进入确认信息页面  开始进行循环点击 <确认-就是这家-我知道了-确认> 模式');
          clickSureBtnWhenHasProd();
        }
        // 没货 继续刷新
        if (mode === 'noProd') {
          let currentBuyMethod = state.buyMethod;
          console.log('没有库存，继续循环刷新');
          if (currentBuyMethod === 'mark') {
            state.buyMethod = 'home';
            handleSimulateClick({
              x: point.originSendToHomePoint.x,
              y: point.originSendToHomePoint.y,
              unobstructed: true
            },);

            checkSureBtnLoading({
              then: handleBuyMethod,
              skip: config.goMarkGet,
              loadingKey: 'homeLoading'
            });
          }
          if (currentBuyMethod === 'home') {
            state.buyMethod = 'mark';
            handleSimulateClick({
              x: point.originGoMarkGetPoint.x,
              y: point.originGoMarkGetPoint.y,
              unobstructed: true
            });

            checkSureBtnLoading({
              then: handleBuyMethod,
              skip: config.sendToHome,
              loadingKey: 'markLoading'
            });
          }
        }
      },
      patchStep: 'chooseDetail',
    });
  }


  function checkSureBtnLoading({ then, skip, loadingKey }) {
    //TODO 卡bug 进寄到家确认信息页面
    let key = !!loadingKey ? loadingKey : 'loadingTime'
    if (skip) {
      then();
    } else {
      let MAX_WAIT_TIME = 2000;
      if (!state[key]) {
        state[key] = Date.now();
      }
      let elapsedTime = Date.now() - state[key];

      if (elapsedTime >= MAX_WAIT_TIME) {
        state[key] = null;
        then();
        return true
      }
      let newScreenOcr = handleoOrcScreen(1).currentScreenOcr;
      if (
        newScreenOcr.includes("确定") ||
        newScreenOcr.includes("已售罄") ||
        newScreenOcr.includes("选择门店")
      ) {
        state[key] = null;
        then();
      } else {
        checkSureBtnLoading({ then, skip, loadingKey });
      }
    }
  }


  function handleAmount() {
    if (state.loopCount > 1) return
    let newScreenOcr = state.currentScreenOcr.slice(state.currentScreenOcr.length - 6)
    let hasAdd =
      newScreenOcr.some((item) => item.includes("2")) ||
      newScreenOcr.includes("2");
    if (config.addOne && !hasAdd) {
      handleSimulateClick({
        x: point.originAcountAddPoint.x,
        y: point.originAcountAddPoint.y,
        unobstructed: true
      });
      sleep(50);
    } else if (!config.addOne && hasAdd) {
      handleSimulateClick({
        x: point.originAcountLessPoint.x,
        y: point.originAcountLessPoint.y,
        unobstructed: true
      });
    }
  }


  // 确认信息并支付 并开启循环模式
  function handleToPayLoop() {
    console.log('进入循环')
    // 是否进入循环  只要第一次点击了确认按钮  就认为进入循环
    state.enterSureLoop = true;
    console.log("等待确认订单页面加载...");
    // 等待页面加载完成
    screenIsLoadedWithOcr({
      wait: state.loopCount < 10 ? 1 : config.orcSleepTime,
      patchStep: "makeSureOrder",
      callBack: ({ mode }) => {
        console.log(mode, "确认信息");
        // 确认信息并支付 按钮
        if (mode === "makeSureOrder") {
          handleSimulateClick({
            x: point.originSureInfoAndPayPoint.x,
            y: point.originSureInfoAndPayPoint.y,
            disabledKey: 'originSureInfoAndPayPoint',
          });
          handleToPayLoop();
        }
        if (mode === 'backToPre') {
          backToPreScreen();
          handleToPayLoop();
        }

        if (mode === 'trySoon') {
          sleep(1000)
          handleToPayLoop();
        }

        // 确认门店信息
        if (mode === "thisOne") {
          handleSimulateClick({
            x: point.originThisMarkPoint.x,
            y: point.originThisMarkPoint.y,
            disabledKey: 'originThisMarkPoint',
          });
          handleToPayLoop();
        }
        // 确认邮寄地址信息
        if (mode === "sureMail") {
          handleSimulateClick({
            x: point.originknowMailPoint.x,
            y: point.originknowMailPoint.y,
            disabledKey: 'originknowMailPoint',
          });
          handleToPayLoop();
        }
        // 判断是否有货 如果没货 点击我知道了  循环第一步
        // 两种形式  手动点击 / 自动跳转（一定时间内不点击会自动跳回选择规格页面）
        if (mode === "known") {
          handleSimulateClick({
            x: point.originNoProdPoint.x,
            y: point.originNoProdPoint.y,
            disabledKey: 'originNoProdPoint',
          });
          handleToPayLoop();
        }
        // 没货 点击我知道了
        if (mode === "nextLoopStart") {
          clickSureBtnWhenHasProd();
        }
        // 抢到了 自动付款
        if (mode === "toPay") {
          device.vibrate(1500);
          sleep(6000);
          let payPoints = point.originPayPoints;
          for (let i = 0; i < payPoints.length; i++) {
            let _point = payPoints[i];
            handleSimulateClick({ x: _point.x, y: _point.y, unobstructed: true });
            sleep(1000);
          }
        }
      },
    });

  }

  function clickSureBtnWhenHasProd() {
    handleAmount()
    state.loopCount++;
    console.log("循环的次数", state.loopCount);
    handleSimulateClick({
      x: point.originSurePoint.x,
      y: point.originSurePoint.y,
      disabledKey: 'originSurePoint',
    });

    handleToPayLoop();
  }

  // 预售时确定按钮不一定能刷新 会停留在 00:00  需要手动下滑
  function waitForFn({ maxWaitTime, next, loadingKey }) {
    let key = !!loadingKey ? loadingKey : 'loadingTime'
    let MAX_WAIT_TIME = maxWaitTime;
    if (!state[key]) {
      state[key] = Date.now();
    }
    let elapsedTime = Date.now() - state[key];
    if (elapsedTime >= MAX_WAIT_TIME) {
      state[key] = null;
      next && next();
      return true
    }
    threads.start(function () {
      setTimeout(() => {
        state[key] = null;
      }, maxWaitTime + 500);
    })
  }

  function backToPreScreen() {
    let { markListScreen, makeSureOrderScreen } = utils.patchScreen({ currentScreenOcr: state.currentScreenOcr });
    // console.log(markListScreen, makeSureOrderScreen, 'markListScreen, makeSureOrderScreen ')
    if (markListScreen || makeSureOrderScreen) {
      handleSimulateClick({
        x: point.originBackScreenPoint.x,
        y: point.originBackScreenPoint.y,
        disabledKey: "originBackScreenPoint"
      });
    }
  }

  // 模拟点击  unobstructed true 不设置clickDisabled
  function handleSimulateClick({ x, y, wait, unobstructed, disabledKey }) {
    let key = !!disabledKey ? disabledKey : 'clickDisabled'
    if (unobstructed) {
      utils.simulateClick({ x, y });
    } else {
      console.log(state, 'state')
      if (state[key]) return;
      threads.start(function () {
        setTimeout(() => {
          state[key] = false
        }, !!wait ? wait : 1500);
      })
      utils.simulateClick({ x, y });
      state[key] = true;
      console.log(state, 'handleSimulateClick-state')
    }
  }

  function screenIsLoadedWithOcr({ callBack, patchStep, wait }) {
    let _wait = !!wait ? wait : 0;
    let { currentScreenOcr } = handleoOrcScreen(_wait);
    let {
      hasQuickBuyBtn,
      hasQuickBuyErrorBtn,
      hasAddCar,
      hasTrySoon,
      POPMARTLoading,
      hasSureBtn,
      quickBuyScreen, // 立即购买按钮页面
      chooseDetailScreen, // 选择规格，购买方式页面
      makeSureOrderScreen, // 确认信息并支付页面
      markListScreen, // 自提门店列表页面
    } = utils.patchScreen({ currentScreenOcr });
    console.log({ state }, '=currentScreenOcr')
    function fallbackLogic() {
      console.log('================兜底逻辑 ===================', { state })
      // 兜底逻辑 没有找到 再多等待一会儿再查找
      screenIsLoadedWithOcr({ callBack, patchStep: 'start', wait });
      return;
    }

    console.log('当前的步骤是', { patchStep });

    if (markListScreen) {
      // 误点进入自提门店列表页面 马上退出
      backToPreScreen();
    }

    if (patchStep === 'start') {
      // 购物车y页面
      if (quickBuyScreen) {
        // 有购物车模式
        if (hasAddCar && hasQuickBuyBtn) {
          callBack({ mode: 'quickBuyWithCar' });
          return;
        }
        // 无购物车模式
        if (!hasAddCar && hasQuickBuyBtn) {
          callBack({ mode: 'quickBuyWithoutCar' });
          return;
        }
        // 距离开售时间还剩 00:00 异常情况
        if (hasQuickBuyErrorBtn) {
          callBack({ mode: 'quickBuyError' });
          return;
        }
      } else if (chooseDetailScreen) {
        // 进入选择规格/购买方式页面
        callBack({ mode: 'loopChooseDetail' });
        return;
      } else if (makeSureOrderScreen) {
        // 确认信息页面
        callBack({ mode: 'loopMakeSureOrder' });
        return;
      } else if (markListScreen) {
        // 误点进入自提门店列表页面 马上退出
        callBack({ mode: 'loopMarkList' });
        return;
      }
    }

    // 选择规格页面
    if (patchStep === 'chooseDetail') {
      if (chooseDetailScreen) {
        // 有货 可以点击购买
        if (currentScreenOcr.includes('确定')) {
          // 仅购买送到家
          if (config.sendToHome && !config.goMarkGet) {
            if (state.buyMethod === 'mark') {
              callBack({ mode: 'noProd' });
              return;
            }
            if (state.buyMethod === 'home') {
              callBack({ mode: 'hasProd' });
              return;
            }
          }
          // 仅购买到店取
          if (!config.sendToHome && config.goMarkGet) {
            if (state.buyMethod === 'mark') {
              callBack({ mode: 'hasProd' });
              return;
            }
            if (state.buyMethod === 'home') {
              callBack({ mode: 'noProd' });
              return;
            }
          }
        }

        // 没货 开始循环点击刷新
        if (currentScreenOcr.includes('已售罄') || !currentScreenOcr.includes('确定')) {
          callBack({ mode: 'noProd' });
          return;
        }
      }
    }

    if (patchStep === 'makeSureOrder') {
      // 有确定按钮 进行下一次循环
      if (chooseDetailScreen) {
        if (hasSureBtn && state.enterSureLoop) {
          callBack({ mode: 'nextLoopStart' });
          return;
        }
      }

      // 确认订单页面
      if (makeSureOrderScreen) {
        if (currentScreenOcr.includes('就是这家')) {
          // 确认门店
          callBack({ mode: 'thisOne' });
          return;
        } else if (currentScreenOcr.includes('确认无误') || currentScreenOcr.some(item => item.includes('无误'))) {
          // 确认无误
          callBack({ mode: 'sureMail' });
          return;
        } else if (currentScreenOcr.includes('我知道了') || currentScreenOcr.some(item => item.includes('道了'))) {
          // 我知道了
          callBack({ mode: 'known' });
          return;
        } else if (currentScreenOcr.includes('微信支付')) {
          // 付款页面
          callBack({ mode: 'toPay' });
          return;
        } else if (hasTrySoon) {
          callBack({ mode: 'trySoon' });
          return;
        } else if (POPMARTLoading && waitForFn({ maxWaitTime: 3500, loadingKey: 'POPMARTLoading' })) {
          callBack({ mode: 'backToPre' });
          return;
        } else {
          callBack({ mode: 'makeSureOrder' });
          return;
        }
      }
    }

    fallbackLogic();
  }

  function handleoOrcScreen(wait) {
    let _wait = !!wait ? wait : config.orcSleepTime;
    let { currentScreenOcr, elapsedTime, startTime, generateId, endTime } = utils.getOrcScreen();
    state.currentScreenOcr = currentScreenOcr;
    state.generateId = generateId;
    sleep(_wait);
    return { currentScreenOcr, elapsedTime, startTime, generateId, endTime };
  }
};

module.exports = {
  main,
};
