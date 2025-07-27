auto();
let state = {
  loopBuyMethodTime: 3000,
  loopBuyMethodCount: 0, // 循环点击送到家 到店取次数
  loopPlaceOrderTime: 3000,
  loopPlaceOrderCount: 0,
  loopPlaceOrderStep: "", // sureAndPayStep sureInfoStep orderResultStep rebackBuyMethodPageStep
  loopPlaceOrderPatchThread: null,
  widghtFindTime: 3000, //查找widght的最大时间
  hasStandard: true, //是否有选择规格
  refreshWithoutFeel: false, // 是否无感刷新
  buyMethod: "mark", // home | mark  // 选择的购买方式
  currentMethod: "", // 当前的购买方式
  addOne: true, //是否数量+1
  currentPage: "", //introduction buyMethod placeOrder
  point: {},
};
const eventKeys = {
  patchPage: "patchPage",
  swipe: "swipe",
};
const introductionPage = "introduction";
const buyMethodPage = "buyMethod";
const placeOrderPage = "placeOrder";
const sureAndPayStep = "sureAndPayStep";
const sureInfoStep = "sureInfoStep";
const orderResultStep = "orderResultStep";
const rebackBuyMethodPageStep = "rebackBuyMethodPageStep";
const event$ = events.emitter();
const storage = storages.create("ppmt_point");

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

  // 正确的调度方法 - 使用两个参数的重载
  global.javaTimer.schedule(timerTask, delay);
  return timerTask;
}

function javaClearTimeout(timerTask) {
  if (timerTask instanceof java.util.TimerTask) {
    timerTask.cancel();
    console.log("定时器已取消");
  } else {
    console.error("无效的 TimerTask 对象");
  }
}

// 初始化购买详情页面配置
function initBuyMethod() {
  // 选择规格 同步取决于是否有选择规格
  if (state.hasStandard) {
    console.log("选择规格-----> 一端");
    handleSimulateClick({
      widget: textContains("整盒含").findOne(state.widghtFindTime),
    });
  }
  // 初始化 购买方式
  patchBuyMethodPageBtnStatus();
  // 选择预售批次 异步
  patchPageFeature({
    text: "选择预售批次",
    callback: () => {
      console.log("选择预售批次");
      handleSimulateClick({
        widget: findTextViewWidget({ text: "购买方式" }).previousSibling(),
      });
      // 滑动代码会让脚本异常卡死 原因未知 TODO
      // event$.emit(eventKeys.swipe, {
      //   mode: "preSale",
      // });
    },
  });
}

// 循环购买方式
function loopBuyMethod() {
  state.loopBuyMethodCount = state.loopBuyMethodCount + 1;
  console.log(
    "已循环购买方式的次数:",
    state.loopBuyMethodCount,
    state.currentPage,
    state.currentMethod,
    state.buyMethod
  );
  if (state.currentPage !== buyMethodPage) return;
  eventTimeControl({
    fn: patchBuyMethodPageBtnStatus,
    time: state.loopBuyMethodTime,
    endFn: loopBuyMethod,
  });
}

//判断选择购买方式页面确定按钮的各种状态
function patchBuyMethodPageBtnStatus() {
  /**
   * 1.刷新图标
   * 2.已售罄
   * 3.去授权  无定位权限
   * 4.选择门店
   * 5.确定
   */
  let startTime = Date.now();
  let endTime = Date.now();
  // let count = 0;  // 测试使用
  if (state.loopBuyMethodCount === 0) {
    if (state.buyMethod === "home") {
      state.currentMethod = "home";
      handleSimulateClick({
        widget: findTextViewWidget({ text: "送到家" }),
      });
    }
    if (state.buyMethod === "mark") {
      state.currentMethod = "mark";
      handleSimulateClick({
        widget: findTextViewWidget({ text: "到店取" }),
      });
    }
  } else {
    if (state.refreshWithoutFeel) {
      handleQuickBuyClick();
    } else {
      if (state.currentMethod === "home") {
        state.currentMethod = "mark";
        handleSimulateClick({
          widget: findTextViewWidget({ text: "到店取" }),
        });
      } else if (state.currentMethod === "mark") {
        state.currentMethod = "home";
        handleSimulateClick({
          widget: findTextViewWidget({ text: "送到家" }),
        });
      }
    }
  }
  const btns = ["loading", "已售罄", "去授权", "选择门店", "确定"];
  while (endTime - startTime < state.loopBuyMethodTime) {
    let features = btns.map((b, index) => {
      let bool = checkTextViewWidgetIsExists(b);
      if (b === "loading") {
        bool = className("android.widget.Image").depth(24).exists();
      }
      return bool;
    });
    if (features[4] && state.currentMethod === state.buyMethod) {
      console.log("匹配确定按钮状态", {
        duration: endTime - startTime,
        features,
        currentMethod: state.currentMethod,
        buyMethod: state.buyMethod,
      });
      // count++;
      // if (count < 5) return undefined;
      handleSureClick();
      return "break";
    }
    endTime = Date.now();
  }
}

function handleSimulateClick({
  widget,
  mockClick = false,
  callback,
  error,
  widgetKey,
  sleepTime = 0,
} = {}) {
  if (widget) {
    if (widgetKey) {
      let point = {
        x: widget.bounds().centerX() - 5,
        y: widget.bounds().centerY() + 5,
      };
      state.point[widgetKey] = point;
      let storagePoints = storage.get("widghtPoint")
        ? JSON.parse(storage.get("widghtPoint"))
        : {};
      storagePoints[widgetKey] = point;
      storage.put("widghtPoint", JSON.stringify(storagePoints));
    }
    widget.click();
  } else if (mockClick) {
    const x = state.point[widgetKey].x;
    const y = state.point[widgetKey].y;
    if (x && y) {
      press(x, y, 1);
    } else {
      error && error();
    }
  }
  sleep(sleepTime);
  callback && callback();
}

// 点击确定按钮
function handleSureClick() {
  // if (state.loopBuyMethodCount < 4) return;
  console.log("已找到确定按钮");
  let amountTextWidget = findTextViewWidget({ text: "数量" });
  let lessWidget = amountTextWidget.nextSibling();
  let numberWidget = amountTextWidget.nextSibling().nextSibling();
  let addWidget = amountTextWidget.nextSibling().nextSibling().nextSibling();
  if (numberWidget.text() === "1" && state.addOne) {
    handleSimulateClick({
      widget: addWidget,
    });
  }
  if (numberWidget.text() === "2" && !state.addOne) {
    handleSimulateClick({
      widget: lessWidget,
    });
  }
  handleSimulateClick({
    widget: findTextViewWidget({ text: "确定" }),
  });
  state.currentPage = placeOrderPage;
  state.loopPlaceOrderStep = sureAndPayStep;
  event$.emit(eventKeys.patchPage, {
    page: placeOrderPage,
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
    javaSetTimeout(() => {
      runThread = false;
    }, timeOut || state.widghtFindTime);
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

function findTextViewWidget({ text }) {
  return className("android.widget.TextView")
    .text(text)
    .findOne(state.widghtFindTime);
}

function checkTextViewWidgetIsExists(text) {
  return className("android.widget.TextView").text(text).exists();
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

// 下单轮询
function loopPlaceOrder() {
  patchPlaceOrderFeature({
    callback: ({ currentStep, errorInfo }) => {
      console.log("currentStep", { currentStep, errorInfo });
      let stepMap = {
        sureAndPayStep: {
          textFeature: "确认信息并支付",
          nextStep: sureInfoStep,
        },
        sureInfoStep: {
          textFeature: state.buyMethod === "home" ? "确认无误" : "就是这家",
          nextStep: orderResultStep,
        },
        orderResultStep: {
          textFeature: "我知道了",
          nextStep: rebackBuyMethodPageStep,
        },
        rebackBuyMethodPageStep: {
          textFeature: "确定",
          nextStep: sureAndPayStep,
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
        widgetKey: currentStep,
      });
    },
  });
}

function patchPlaceOrderFeature({ callback }) {
  let startTime = Date.now();
  let endTime = Date.now();
  while (endTime - startTime < state.widghtFindTime) {
    if (state.loopPlaceOrderStep === sureAndPayStep) {
      let sureAndPayFeature = checkTextViewWidgetIsExists("确认信息并支付");
      if (sureAndPayFeature) {
        callback({ currentStep: sureAndPayStep });
        break;
      }
    }
    if (state.loopPlaceOrderStep === sureInfoStep) {
      let sureMarkOrMailInfo =
        state.buyMethod === "home"
          ? checkTextViewWidgetIsExists("确认无误") ||
            checkTextViewWidgetIsExists("请确认收货信息")
          : checkTextViewWidgetIsExists("请确认以下信息") ||
            checkTextViewWidgetIsExists("就是这家");
      if (sureMarkOrMailInfo) {
        sleep(5000);
        state.loopPlaceOrderCount = state.loopPlaceOrderCount + 1;
        callback({ currentStep: sureInfoStep });
        break;
      }
    }

    if (state.loopPlaceOrderStep === orderResultStep) {
      let orderResultErrorFeature = checkTextViewWidgetIsExists("我知道了");
      if (orderResultErrorFeature) {
        callback({ currentStep: orderResultStep });
        break;
      }
    }

    if (state.loopPlaceOrderStep === rebackBuyMethodPageStep) {
      let buyMethodFeature =
        checkTextViewWidgetIsExists("购买方式") ||
        checkTextViewWidgetIsExists("确定");
      if (buyMethodFeature) {
        callback({ currentStep: rebackBuyMethodPageStep });
        break;
      }
    }

    // 脚本在确认信息页面启动 需要初始化一下loopPlaceOrderStep
    if (!state.loopPlaceOrderStep && endTime - startTime > 1600) {
      let sureAndPayFeature = checkTextViewWidgetIsExists("确认信息并支付");
      let sureMarkOrMailInfo =
        state.buyMethod === "home"
          ? checkTextViewWidgetIsExists("确认无误") ||
            checkTextViewWidgetIsExists("请确认收货信息")
          : checkTextViewWidgetIsExists("请确认以下信息") ||
            checkTextViewWidgetIsExists("就是这家");
      let orderResultErrorFeature = checkTextViewWidgetIsExists("我知道了");
      let buyMethodFeature =
        checkTextViewWidgetIsExists("购买方式") ||
        checkTextViewWidgetIsExists("确定");

      if (sureMarkOrMailInfo) {
        callback({ currentStep: sureInfoStep });
        break;
      }
      if (orderResultErrorFeature) {
        callback({ currentStep: orderResultStep });
        break;
      }

      if (
        buyMethodFeature &&
        !sureAndPayFeature &&
        !sureMarkOrMailInfo &&
        !orderResultErrorFeature
      ) {
        callback({ currentStep: rebackBuyMethodPageStep });
      } else {
        callback({ currentStep: sureAndPayStep });
      }
    }

    endTime = Date.now();
  }
}

function patchPage() {
  event$.on(eventKeys.patchPage, ({ page }) => {
    if (page === introductionPage) {
      handleQuickBuyClick({
        fn: () => {
          state.currentPage = buyMethodPage;
          event$.emit(eventKeys.patchPage, {
            page: buyMethodPage,
            from: introductionPage,
          });
        },
      });
    }
    if (page === buyMethodPage) {
      initBuyMethod();
      loopBuyMethod();
    }
    if (page === placeOrderPage) {
      loopPlaceOrder();
    }
  });
}

// 匹配当前是哪个页面
function watchPage({ callback }) {
  while (true) {
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
}

function debounce(func, wait) {
  let lastExecTime = 0; // 上次执行时间戳
  console.log(222);
  return function (...args) {
    let now = Date.now(); // 当前时间戳
    // 如果距离上次执行超过 wait 时间，则立即执行
    console.log(now - lastExecTime, "now - lastExecTime");
    if (now - lastExecTime > wait) {
      console.log(222233);
      func.apply(this, args);
      lastExecTime = now; // 更新执行时间
    }
  };
}

// 初始化配置
function initConfig() {
  state.point = storage.get("widghtPoint")
    ? JSON.parse(storage.get("widghtPoint"))
    : {};
}

function main() {
  initConfig();
  patchPage();
  watchPage({
    callback: ({ page }) => {
      event$.emit(eventKeys.patchPage, { page });
    },
  });
}
main();
