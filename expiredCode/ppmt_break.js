auto();
let state = {
  loopBuyMethodTime: 3000,
  loopBuyMethodCount: 0, // 循环点击送到家 到店取次数
  loopBuyMethodPatchThread: null,
  // loopBuyMethodStatus: false, // 循环点击送到家 到店取状态机 暂时未使用
  loopPlaceOrderTime: 3000,
  loopPlaceOrderCount: 0,
  loopPlaceOrderStep: "", // sureAndPay sureInfo orderResult rebackBuyMethodPage
  // sonThreadMap: {}, // 暂时未使用
  loopPlaceOrderPatchThread: null,
  widghtFindTime: 3000, //查找widght的最大时间
  hasStandard: true, //是否有选择规格
  refreshWithoutFeel: false, // 是否无感刷新
  buyMethod: "mark", // home | mark  // 选择的购买方式
  currentMethod: "", // 当前的购买方式
  addOne: true, //是否数量+1
  currentPage: "", //introduction buyMethod placeOrder
};
// isNotEmpty()
const eventKeys = {
  jump: "jump",
  start: "start",
  swipe: "swipe",
};
const introductionPage = "introduction";
const buyMethodPage = "buyMethod";
const placeOrderPage = "placeOrder";
const sureAndPay = "sureAndPay";
const sureInfo = "sureInfo";
const orderResult = "orderResult";
const rebackBuyMethodPage = "rebackBuyMethodPage";

if (!global.javaTimer) {
  global.javaTimer = new java.util.Timer(true);
}
events.on("exit", () => {
  console.log("exit");
  if (global.javaTimer) {
    global.javaTimer.cancel();
    global.javaTimer = null;
  }
});
function javaSetTimeout(callback, delay) {
  // 正确的调度方法 - 使用两个参数的重载
  if (global.javaTimer) {
    const timerTask = new java.util.TimerTask({
      run: () => {
        try {
          // 自动处理 UI 线程操作
          if (typeof ui !== "undefined") {
            ui.run(callback);
          } else {
            callback();
          }
        } catch (e) {
          console.error("定时任务执行出错: " + e);
        }
      },
    });
    global.javaTimer.schedule(timerTask, delay);
    return timerTask;
  } else {
    return setTimeout(() => {
      callback && callback();
    }, delay);
  }
}

function javaClearTimeout(timerTask) {
  if (timerTask instanceof java.util.TimerTask) {
    timerTask.cancel();
    console.log("定时器已取消");
  } else {
    console.error("无效的 TimerTask 对象");
  }
}

// const myTask = javaSetTimeout(() => {
//     log("5秒后执行此任务");
// }, 5000);

// // 决定取消任务
// javaClearTimeout(myTask);

const event$ = events.emitter();

// 初始化购买详情页面配置
function initBuyMethod() {
  // 选择规格 同步取决于是否有选择规格
  state.hasStandard &&
    patchPageFeature({
      text: "选择规格",
      callback: () => {
        console.log("选择规格-----> 一端");
        let standardWholeBtn = textContains("整盒含").findOne(
          state.widghtFindTime
        );
        if (standardWholeBtn) {
          standardWholeBtn.click();
          state.initStandardWhole = true;
        }
      },
      sync: state.hasStandard,
    });

  // 购买方式  同步
  patchPageFeature({
    text: "购买方式",
    callback: () => {
      let sureBtnSync = checkTextViewWidgetIsExists("确定");
      console.log(
        "进入页面第一次选择购买方式,先判断确定按钮是否已存在",
        sureBtnSync
      );
      if (sureBtnSync) return;
      let sendHomeBtn = findTextViewWidget({ text: "送到家" });
      let goMarketBtn = findTextViewWidget({ text: "到店取" });
      if (!sendHomeBtn || !goMarketBtn) return;
      state.sendHomeBtnPoint = {
        x: sendHomeBtn.bounds().centerX(),
        y: sendHomeBtn.bounds().centerX(),
      };
      state.goMarketBtnPoint = {
        x: goMarketBtn.bounds().centerX(),
        y: goMarketBtn.bounds().centerX(),
      };
      if (state.buyMethod === "home") {
        state.currentMethod = "home";
        sendHomeBtn.click();
      }
      if (state.buyMethod === "mark") {
        state.currentMethod = "mark";
        goMarketBtn.click();
      }
    },
    sync: true,
  });

  // 选择预售批次 异步
  patchPageFeature({
    text: "选择预售批次",
    callback: () => {
      console.log("选择预售批次");
      let buyMethodTextWidget = findTextViewWidget({ text: "购买方式" });
      let lastPreSaleWidget = buyMethodTextWidget.previousSibling();
      lastPreSaleWidget.click();
      // 滑动代码会让脚本异常卡死 原因未知 TODO
      event$.emit(eventKeys.swipe, {
        mode: "preSale",
      });
    },
  });
  // // // 确定按钮 异步
  // if (state.loopBuyMethodPatchThread) {
  //   state.loopBuyMethodPatchThread.interrupt();
  // }
  // state.loopBuyMethodPatchThread = patchPageFeature({
  //   text: "确定",
  //   callback: handleSureClick,
  // });
}

// 循环购买方式
function loopBuyMethod() {
  state.loopBuyMethodCount = state.loopBuyMethodCount + 1;
  console.log(
    "已循环购买方式的次数:",
    state.loopBuyMethodCount,
    state.currentPage
  );
  if (state.currentPage !== buyMethodPage) return;
  eventTimeControl({
    fn: patchBuyMethodPageBtnStatus,
    time: state.loopBuyMethodTime,
    endFn: loopBuyMethod,
  });
}

/**
 * 判断选择购买方式页面确定按钮的各种状态
 * 1.刷新图标
 * 2.已售罄
 * 3.去授权  无定位权限
 * 4.选择门店
 * 5.确定
 */
function patchBuyMethodPageBtnStatus() {
  let runThread = true;
  if (state.refreshWithoutFeel) {
    handleQuickBuyClick();
  } else {
    let sendHomeBtn = findTextViewWidget({ text: "送到家" });
    let goMarketBtn = findTextViewWidget({ text: "到店取" });
    if (!sendHomeBtn || !goMarketBtn) return;
    if (state.currentMethod === "home") {
      state.currentMethod = "mark";
      goMarketBtn.click();
    } else if (state.currentMethod === "mark") {
      state.currentMethod = "home";
      sendHomeBtn.click();
    }
  }
  const btns = ["loading", "已售罄", "去授权", "选择门店", "确定"];
  if (state.loopBuyMethodPatchThread) {
    state.loopBuyMethodPatchThread.interrupt();
  }
  javaSetTimeout(() => {
    runThread = false;
  }, state.loopBuyMethodTime);
  state.loopBuyMethodPatchThread = startThread({
    fn: () => {
      while (runThread) {
        let features = btns.map((b, index) => {
          let bool = checkTextViewWidgetIsExists(b);
          if (b === "loading") {
            bool = className("android.widget.Image").depth(24).exists();
          }
          return bool;
        });
        if (features[4]) {
          handleSureClick();
          return "break";
        }
      }
    },
  });
}

function handleSimulateClick({
  widget,
  mockClick = false,
  callback,
  widgetKey,
  sleepTime = 0,
} = {}) {
  if (widget) {
    if (widgetKey) {
      state[widgetKey] = {
        x: widget.bounds().centerX(),
        y: widget.bounds().centerY(),
      };
    }
    if (mockClick) {
      const x = state[widgetKey].x;
      const y = state[widgetKey].y;
      if (x && y) {
        click(x, y);
      } else {
        widget.click();
      }
    } else {
      widget.click();
    }
    sleep(sleepTime);
    callback && callback();
  }
}

// 点击确定按钮
function handleSureClick() {
  // if (state.loopBuyMethodCount < 4) return;
  console.log("已找到确定按钮确定");
  let sureBtn = findTextViewWidget({ text: "确定" });
  if (!sureBtn) return;
  let amountTextWidget = findTextViewWidget({ text: "数量" });
  let lessWidget = amountTextWidget.nextSibling();
  let numberWidget = amountTextWidget.nextSibling().nextSibling();
  let addWidget = amountTextWidget.nextSibling().nextSibling().nextSibling();
  if (numberWidget.text() === "1" && state.addOne) {
    addWidget.click();
  }
  if (numberWidget.text() === "2" && !state.addOne) {
    lessWidget.click();
  }
  sureBtn.click();
  state.currentPage = placeOrderPage;
  state.loopPlaceOrderStep = sureAndPay;
  event$.emit(eventKeys.jump, {
    mode: "init",
    from: buyMethodPage,
  });
}

/**
 * 事件时间控制方法
 * flag === "break" 立即打断
 * flag === 'skipSleep' 忽略sleep方法
 */
function eventTimeControl({ fn, time = 0, endFn }) {
  let startTime = Date.now();
  let flag = fn && fn();
  if (flag === "break") return;
  let endTime = Date.now();
  let duration = endTime - startTime;
  let sleepTime = Math.max(time - duration, 0);
  flag !== "skipSleep" && sleep(sleepTime);
  endFn && endFn();
}

// 创建子线程
function startThread({ threadKey, fn }) {
  let t = threads.start(fn);
  threadKey && setInterval(() => {}, 1000);
  t.waitFor();
  return t;
}

// 用于匹配页面细节
function patchPageFeature({ callback, text, timeOut, sync }) {
  if (sync) {
    callback();
  } else {
    let runThread = true;
    javaSetTimeout(() => {
      runThread = false;
    }, timeOut || state.widghtFindTime);
    let t = startThread({
      fn: () => {
        while (runThread) {
          let feature = checkTextViewWidgetIsExists(text);
          if (feature) {
            callback && callback();
            break;
          }
        }
      },
    });

    return t;
  }
}

// 点击立即购买
function handleQuickBuyClick({ fn } = {}) {
  let quickBuyButton = findTextViewWidget({ text: "立即购买" });
  if (quickBuyButton) {
    console.log("立即购买按钮点击");
    quickBuyButton.click();
  }
  fn && fn();
}

// 初始化配置
function initConfig() {}

function findTextViewWidget({ text }) {
  return className("android.widget.TextView")
    .text(text)
    .findOne(state.widghtFindTime);
}

function checkTextViewWidgetIsExists(text) {
  return className("android.widget.TextView").text(text).exists();
}

// 匹配当前是哪个页面
function patchPage({ callback }) {
  let runThread = true;
  javaSetTimeout(() => {
    runThread = false;
  }, 24 * 60 * 60);
  startThread({
    fn: () => {
      while (runThread) {
        let feature0 =
          checkTextViewWidgetIsExists("购物车") ||
          checkTextViewWidgetIsExists("立即购买");
        let feature1 = checkTextViewWidgetIsExists("购买方式");
        let feature2 = checkTextViewWidgetIsExists("确认信息并支付");
        console.log({ feature0, feature1, feature2 });
        if (
          (feature0 && feature1 && feature2) ||
          (!feature0 && !feature1 && feature2)
        ) {
          state.currentPage = placeOrderPage;
          callback({ page: placeOrderPage });
          break;
        }
        if (
          (feature0 && feature1 && !feature2) ||
          (!feature0 && feature1 && !feature2)
        ) {
          state.currentPage = buyMethodPage;
          callback({ page: buyMethodPage });
          break;
        }
        if (feature0 && !feature1 && !feature2) {
          state.currentPage = introductionPage;
          callback({ page: introductionPage });
          break;
        }
        if (!feature0 && !feature1 && !feature2) {
          // TODO 无法获取控件
          // break;
        }
      }
    },
  });
}

function watchSwipe() {
  event$.on(eventKeys.swipe, ({ mode }) => {
    if (mode === "preSale") {
      try {
        swipe(
          device.width / 2,
          device.height * 0.75,
          device.width / 2,
          device.height * 0.25,
          200
        );
      } catch (error) {}
    }
  });
}

// 商品开始页面  页面一
function handlerIntroductionThread() {
  event$.on(eventKeys.start, ({ mode, from }) => {
    if (from !== introductionPage) return;
    console.log({ from }, "页面一");
    if (mode === "start") {
      handleQuickBuyClick({
        fn: () => {
          state.currentPage = buyMethodPage;
          event$.emit(eventKeys.jump, {
            mode: "init",
            from: introductionPage,
          });
        },
      });
    }
  });
}

// 选择购买方式页面  页面二
function handlerBuyMethodThread() {
  event$.on(eventKeys.start, ({ mode, from }) => {
    if (from !== buyMethodPage) return;
    console.log({ from }, "页面二");
    initBuyMethod();
    loopBuyMethod();
  });
  event$.on(eventKeys.jump, ({ mode, from }) => {
    if (mode === "init" && from === introductionPage) {
      console.log({ from }, "页面二");
      initBuyMethod();
      loopBuyMethod();
    }
  });
  // watchSwipe();
}

// 确认信息并支付页面  页面三
function handlerPlaceOrderThread() {
  event$.on(eventKeys.start, ({ mode, from }) => {
    if (from !== placeOrderPage) return;
    console.log({ from }, "页面三start");
    patchPlaceOrderFeature({
      callback: ({ currentStep }) => {
        log(222);
        state.loopPlaceOrderStep = currentStep;
        loopPlaceOrder();
      },
      static: true,
    });
  });

  event$.on(eventKeys.jump, ({ mode, from }) => {
    if (mode === "init" && from === buyMethodPage) {
      console.log({ from }, "页面三jump");
      loopPlaceOrder();
    }
  });
}

// 下单轮询
function loopPlaceOrder() {
  patchPlaceOrderFeature({
    callback: ({ currentStep, errorInfo }) => {
      let stepMap = {
        sureAndPay: {
          textFeature: "确认信息并支付",
          nextStep: sureInfo,
        },
        sureInfo: {
          textFeature: state.buyMethod === "home" ? "确认无误" : "就是这家",
          nextStep: orderResult,
        },
        orderResult: {
          textFeature: "我知道了",
          nextStep: rebackBuyMethodPage,
        },
        rebackBuyMethodPage: {
          textFeature: "确定",
          nextStep: sureAndPay,
        },
      };
      handleSimulateClick({
        widget: findTextViewWidget({
          text: stepMap[currentStep].textFeature,
        }),
        callback: () => {
          state.loopPlaceOrderStep = stepMap[currentStep].nextStep;
          loopPlaceOrder();
        },
      });
    },
  });
}

function patchPlaceOrderFeature({ callback, static = false } = {}) {
  let runThread = true;
  javaSetTimeout(() => {
    runThread = false;
  }, state.widghtFindTime);
  let startTime = Date.now();
  if (state.loopPlaceOrderPatchThread) {
    state.loopPlaceOrderPatchThread.interrupt();
  }
  state.loopPlaceOrderPatchThread = startThread({
    fn: () => {
      while (runThread) {
        let buyMethodFeature = checkTextViewWidgetIsExists("购买方式");
        let sureAndPayFeature = checkTextViewWidgetIsExists("确认信息并支付");
        let sureMailFeature =
          checkTextViewWidgetIsExists("确认无误") ||
          checkTextViewWidgetIsExists("请确认收货信息");
        let sureMarkFeature =
          checkTextViewWidgetIsExists("请确认以下信息") ||
          checkTextViewWidgetIsExists("就是这家");
        let orderResultErrorFeature = checkTextViewWidgetIsExists("我知道了");
        let orderResultErrorInfoFeature = orderResultErrorFeature
          ? findTextViewWidget({
              text: "我知道了",
            }).previousSibling()
          : { text: () => "" };
        let orderResultErrorInfo = orderResultErrorInfoFeature.text(); // 下单失败提示文字
        // console.log({
        //   buyMethodFeature,
        //   sureAndPayFeature,
        //   sureMailFeature,
        //   sureMarkFeature,
        //   orderResultErrorFeature,
        //   orderResultErrorInfo,
        //   static,
        //   loopPlaceOrderStep: state.loopPlaceOrderStep,
        // });

        // 确认信息 步骤  sureAndPay
        if (
          sureAndPayFeature &&
          !sureMailFeature &&
          !sureMarkFeature &&
          !orderResultErrorFeature
        ) {
          if (state.loopPlaceOrderStep === sureAndPay || static) {
            console.log("当前步骤", state.loopPlaceOrderStep);
            callback && callback({ currentStep: sureAndPay });
            break;
          }
        }

        // 确认邮寄地址/门店地址  步骤 sureInfo
        if (sureAndPayFeature && (sureMarkFeature || sureMailFeature)) {
          if (state.loopPlaceOrderStep === sureInfo || static) {
            console.log("当前步骤", state.loopPlaceOrderStep);
            sleep(3000);
            callback && callback({ currentStep: sureInfo });
            break;
          }
        }

        // 下单未成功 返回失败原因步骤 orderResult
        if (
          sureAndPayFeature &&
          !sureMarkFeature &&
          !sureMailFeature &&
          orderResultErrorFeature
        ) {
          if (state.loopPlaceOrderStep === orderResult || static) {
            console.log("当前步骤", state.loopPlaceOrderStep);
            callback &&
              callback({
                currentStep: orderResult,
                errorInfo: orderResultErrorInfo,
              });
            break;
          }
        }

        // 回退到购买方式页面
        if (
          buyMethodFeature &&
          !sureAndPayFeature &&
          !sureMailFeature &&
          !sureMarkFeature &&
          !orderResultErrorFeature
        ) {
          if (state.loopPlaceOrderStep === rebackBuyMethodPage) {
            console.log("当前步骤", state.loopPlaceOrderStep);
            callback && callback({ currentStep: rebackBuyMethodPage });
            break;
          }
        }

        if (
          !sureAndPayFeature &&
          !sureMailFeature &&
          !sureMarkFeature &&
          !orderResultErrorFeature
        ) {
          console.log("当前步骤", state.loopPlaceOrderStep);
          let errorTimeKeep = Date.now() - startTime;
          if (errorTimeKeep > 3000) {
            callback && callback({ currentStep: rebackBuyMethodPage });
            break;
          }
        }
      }
    },
  });
}

function main() {
  initConfig();
  const introductionThread = startThread({
    threadKey: "introductionthread",
    fn: handlerIntroductionThread,
  });
  const buyMethodThread = startThread({
    threadKey: "buyMethodthread",
    fn: handlerBuyMethodThread,
  });
  const placeOrderThread = startThread({
    threadKey: "placeOrderthread",
    fn: handlerPlaceOrderThread,
  });
  patchPage({
    callback: ({ page }) => {
      event$.emit(eventKeys.start, {
        mode: "start",
        from: page,
      });
    },
  });

  // javaSetTimeout(()=>{
  //   engines.myEngine().forceStop(); // 强制停止当前脚本
  // },10000)
}
main();
