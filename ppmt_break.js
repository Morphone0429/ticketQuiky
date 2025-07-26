auto();
let state = {
  loopBuyMethodTime: 3000,
  loopBuyMethodCount: 0, // 循环点击送到家 到店取次数
  loopBuyMethodStatus: false, // 循环点击送到家 到店取状态机 暂时未使用
  widghtFindTime: 3000, //查找widght的最大时间
  hasStandard: true, //是否有选择规格
  refreshWithoutFeel: true, // 是否无感刷新
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

// const myTask = javaSetTimeout(() => {
//     log("5秒后执行此任务");
// }, 5000);

// // 决定取消任务
// javaClearTimeout(myTask);

const event$ = events.emitter();

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
      let sureBtnSync = className("android.widget.TextView")
        .text("确定")
        .exists();
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
  // 确定按钮 异步
  patchPageFeature({
    text: "确定",
    callback: handleSureClick,
  });
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
  startThread({
    fn: () => {
      while (runThread) {
        let features = btns.map((b, index) => {
          let bool = className("android.widget.TextView").text(b).exists();
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

  javaSetTimeout(() => {
    runThread = false;
  }, state.loopBuyMethodTime);
}

function handleSimulateClick({ x, y, duration }) {
  const _duration = duration || 1;
  // press(x, y, _duration)
  click(x, y);
  // click(child.bounds().centerX(), child.bounds().centerY());
}

// 点击确定按钮
function handleSureClick() {
  if (state.loopBuyMethodCount < 5) return;
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
  event$.emit(eventKeys.jump, {
    mode: "init",
    from: buyMethodPage,
  });
}

// 确认信息并支付页面  页面三
function handlerPlaceOrderThread() {
  event$.on(eventKeys.start, ({ mode, from }) => {
    if (from !== placeOrderPage) return;
    console.log(from);
  });

  event$.on(eventKeys.jump, ({ mode, from }) => {
    if (mode === "init" && from === buyMethodPage) {
      console.log({ from }, "页面三");
      // initBuyMethod();
      // loopBuyMethod();
    }
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
  let t = threads.start(function () {
    fn();
  });
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
    startThread({
      fn: () => {
        while (runThread) {
          let feature = className("android.widget.TextView")
            .text(text)
            .exists();
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

// 匹配当前是哪个页面
function patchPage({ callback }) {
  let runThread = true;
  startThread({
    fn: () => {
      while (runThread) {
        let feature0 = className("android.widget.TextView")
          .text("购物车")
          .exists();
        let feature1 = className("android.widget.TextView")
          .text("购买方式")
          .exists();
        let feature2 = className("android.widget.TextView")
          .text("确认信息并支付")
          .exists();
        console.log({ feature0, feature1, feature2 });
        if (feature0 && feature1 && feature2) {
          state.currentPage = placeOrderPage;
          callback({ page: placeOrderPage });
          break;
        }
        if (feature0 && feature1 && !feature2) {
          state.currentPage = buyMethodPage;
          callback({ page: buyMethodPage });
          break;
        }
        if (feature0 && !feature1 && !feature2) {
          state.currentPage = introductionPage;
          callback({ page: introductionPage });
          break;
        }
      }
    },
  });
  javaSetTimeout(() => {
    runThread = false;
  }, state.widghtFindTime);
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
  javaSetTimeout(() => {
    patchPage({
      callback: ({ page }) => {
        event$.emit(eventKeys.start, {
          mode: "start",
          from: page,
        });
      },
    });
  }, 20);
}

// watchSwipe();
main();
