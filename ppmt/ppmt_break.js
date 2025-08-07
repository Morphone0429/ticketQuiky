auto();
let state = {
  loopBuyMethodTime: 600,
  loopBuyMethodCount: 0, // 循环点击送到家 到店取次数
  loopPlaceOrderKeepTime: 3000, // 循环确认订单流程的最大时长
  loopPlaceOrderKeepTimeWhenBreak: 1350, // 1350
  loopPlaceOrderStartTime: 0,
  loopPlaceOrderCount: 0,
  loopPlaceOrderStep: "", // sureAndPayStep sureInfoStep orderResultStep rebackBuyMethodPageStep
  widghtFindTime: 10000, //查找widght的最大时间
  hasStandard: true, //是否有选择规格
  refreshWithoutFeel: true, // 是否无感刷新
  breakLimit: true,
  buyMethod: "mark", // home | mark  // 选择的购买方式
  currentMethod: "", // 当前的购买方式
  addOne: true, //是否数量+1
  currentPage: "", //introduction buyMethod placeOrder
  point: {},
  currentOrcInfo: [],
  orcThread: null,
  countdownErrorStartTime: 0,
  clickCount: 0,
  popLodingstartTime: 0,
  sureBtnStartTime: 0,
  isDev: false,
};
const eventKeys = {
  patchPage: "patchPage",
  swipe: "swipe",
  orc: "orc",
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
const storage_state = storages.create("ppmt_state");

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

requestScreenCapture();

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
      handleQuickBuyClick({
        fn: () => {
          patchPageFeature({
            text: "选择预售批次",
            callback: () => {
              console.log("选择预售批次");
              handleSimulateClick({
                widget: findTextViewWidget({
                  text: "购买方式",
                }).previousSibling(),
              });
            },
          });
        },
      });
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
  callback,
  error,
  widgetKey = '',
  sleepTime = 0,
} = {}) {
  // 防止确认订单轮询时 点击两次 开启多个loop
  if (state.widgetDisabled === widgetKey && state.currentPage === placeOrderPage) return;
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
    console.log(
      "当前点击的widget:",
      widget.text() ? widget.text() : widget.center()
    );
    widget.click();
  } else {
    const x = state.point[widgetKey].x;
    const y = state.point[widgetKey].y;
    if (x && y) {
      press(x, y, 1);
    } else {
      error && error();
    }
  }
  state.widgetDisabled = widgetKey
  state.clickCount = state.clickCount + 1;
  sleep(sleepTime);
  callback && callback();
}

// 模拟点击
function simulateClick({ x, y, clickTime } = {}) {
  if (!x || !y) return;
  let _x = random(x[0], x[1]);
  let _y = random(y[0], y[1]);
  click(_x, _y);
  // if (!!clickTime) {
  //   press(_x, _y, clickTime);
  // } else {
  //   let _random = random(1, 11);
  //   let isEven = _random % 2 === 0;
  //   if (isEven) {
  //     let _randomDuration = random(20, 40) || 30;
  //     press(_x, _y, _randomDuration);
  //   } else {
  //     click(_x, _y);
  //   }
  // }
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
    widgetKey: "sureBtn",
  });
  console.log(state.loopPlaceOrderCount, "确认订单页面循环次数");

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
function startThread({ threadKey, fn } = {}) {
  let t = threads.start(fn);
  threadKey && setInterval(() => { }, 1000);
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
  handleSimulateClick({
    widget: findTextViewWidget({ text: "立即购买" }),
    callback: fn,
  });
}

function findTextViewWidget({ text }) {
  return className("android.widget.TextView")
    .text(text)
    .findOne(state.widghtFindTime);
}

function trySwipeUp({ fn } = {}) {
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
  fn && fn();
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
      } catch (error) { }
    }
  });
}

function controlLoopPlaceOrderKeepTime({ }) {
  if (state.loopPlaceOrderStartTime === 0) {
    state.loopPlaceOrderStartTime = Date.now();
    return;
  }
  let endTime = Date.now();
  let duration = endTime - state.loopPlaceOrderStartTime;
  let sleepTime = Math.max(
    state.breakLimit
      ? state.loopPlaceOrderKeepTimeWhenBreak
      : state.loopPlaceOrderKeepTime - duration,
    0
  );
  sleep(sleepTime);
  state.loopPlaceOrderStartTime = Date.now();
}

// 下单轮询
function loopPlaceOrder() {
  state.popLodingstartTime = 0;
  state.sureBtnStartTime = 0;
  patchPlaceOrderFeature({
    callback: ({ currentStep }) => {
      console.log("currentStep", {
        currentStep,
        breakLimit: state.breakLimit,
        popLodingstartTime: state.popLodingstartTime,
        sureBtnStartTime: state.sureBtnStartTime,
        loopPlaceOrderStep: state.loopPlaceOrderStep,
      });
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

      // 当前步骤是 确认门店/邮寄地址信息时  判断是否要破盾
      // TODO 限制破盾次数
      if (currentStep === orderResultStep && state.breakLimit) {
        // const keepErrorInfo = ["未营业"];
        // 订单内商品库存不足,请您重新核对 || 同一时间下单人数过多，建议您稍后重试 自动返回
        let errorWidget = findTextViewWidget({ text: "我知道了" });
        if (errorWidget) {
          let errorInfo = errorWidget.previousSibling().text();
          let match = errorInfo.match(/未营业|当前排队人数/);
          console.log(errorInfo);
          if (match && checkTextViewWidgetIsExists("确认信息并支付")) {
            stepMap.orderResultStep = {
              textFeature: "确认信息并支付",
              nextStep: sureInfoStep,
            };
          }
        }
      } else {
        stepMap.orderResultStep = {
          textFeature: "我知道了",
          nextStep: rebackBuyMethodPageStep,
        };
      }
      if (currentStep === sureInfoStep && state.loopPlaceOrderCount === 0) {
        event$.emit(eventKeys.orc, { action: true });
      }

      if (state.isDev) {
        const isC = Math.floor(Math.random() * 10) % 2 === 1
        console.log("isDev循环时模拟的次数%", isC, currentStep)
        if (
          isC &&
          currentStep === orderResultStep
        ) {
          handleSimulateClick({
            widget: id("gy").findOne(state.widghtFindTime),
          });
        } else {
          handleSimulateClick({
            widget: findTextViewWidget({
              text: stepMap[currentStep].textFeature,
            }),
            callback: () => {
              state.loopPlaceOrderStep = stepMap[currentStep].nextStep;
              if (currentStep === sureInfoStep) {
                state.loopPlaceOrderCount = state.loopPlaceOrderCount + 1;
              }
              loopPlaceOrder();
            },
            widgetKey: currentStep,
          });
        }
      } else {
        handleSimulateClick({
          widget: findTextViewWidget({
            text: stepMap[currentStep].textFeature,
          }),
          callback: () => {
            state.loopPlaceOrderStep = stepMap[currentStep].nextStep;
            if (currentStep === sureInfoStep) {
              state.loopPlaceOrderCount = state.loopPlaceOrderCount + 1;
            }
            loopPlaceOrder();
          },
          widgetKey: currentStep,
        });
      }
    },
  });
}

function patchPlaceOrderFeature({ callback }) {
  let startTime = Date.now();
  let endTime = Date.now();
  let isFirstEnter = state.loopPlaceOrderCount === 0;
  console.log({ loopPlaceOrderStep: state.loopPlaceOrderStep }, "期望匹配的步骤");
  while (endTime - startTime < state.widghtFindTime) {
    if (state.loopPlaceOrderStep === sureAndPayStep) {
      let sureAndPayFeature =
        checkTextViewWidgetIsExists("确认信息并支付") ||
        checkTextViewWidgetIsExists("确认订单");
      console.log({ sureAndPayFeature, duration: Date.now() - startTime });
      if (sureAndPayFeature || isFirstEnter) {
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
      if (sureMarkOrMailInfo || isFirstEnter) {
        controlLoopPlaceOrderKeepTime();
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
      // 自动返回时兜底
      let buyMethodFeature =
        (checkTextViewWidgetIsExists("购买方式") ||
          checkTextViewWidgetIsExists("确定")) &&
        !checkTextViewWidgetIsExists("确认信息并支付");
      if (buyMethodFeature) {
        callback({ currentStep: rebackBuyMethodPageStep });
        break;
      }
    }

    if (state.loopPlaceOrderStep === rebackBuyMethodPageStep) {
      let buyMethodFeature =
        (checkTextViewWidgetIsExists("购买方式") ||
          checkTextViewWidgetIsExists("确定")) &&
        !checkTextViewWidgetIsExists("确认信息并支付");
      if (buyMethodFeature) {
        callback({ currentStep: rebackBuyMethodPageStep });
        break;
      }
    }

    // 脚本在确认信息页面启动 需要初始化一下loopPlaceOrderStep
    if (!state.loopPlaceOrderStep && endTime - startTime > 10) {
      let sureAndPayFeature =
        checkTextViewWidgetIsExists("确认信息并支付") ||
        checkTextViewWidgetIsExists("确认订单");
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
        break;
      } else {
        callback({ currentStep: sureAndPayStep });
        break;
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
      checkTextViewWidgetIsExists("立即购买") ||
      textContains("距离开售时间").exists();
    let feature1 = checkTextViewWidgetIsExists("购买方式");
    let feature2 =
      checkTextViewWidgetIsExists("确认信息并支付") ||
      checkTextViewWidgetIsExists("确认订单");
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
      if (checkTextViewWidgetIsExists("立即购买")) {
        state.currentPage = introductionPage;
        callback({ page: introductionPage });
        break;
      } else {
        console.log("倒计时:", textContains("距离开售时间").exists());
        // 距离开售时间还剩00:00 异常问题 持续2s 则刷新页面
        if (textContains("距离开售时间还剩00:00").exists()) {
          // if (textContains("立即购买").exists()) {
          if (state.countdownErrorStartTime === 0) {
            state.countdownErrorStartTime = Date.now();
          }
          if (Date.now() - state.countdownErrorStartTime > 2000) {
            state.countdownErrorStartTime =
              state.countdownErrorStartTime + 24 * 60 * 60 * 1000;
            trySwipeUp();
          }
        }
      }
    }
    if (!feature0 && !feature1 && !feature2) {
      // TODO 无法获取控件
      // 判断指定包名的无障碍服务是否开启
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
      func.apply(this, args);
      lastExecTime = now; // 更新执行时间
    }
  };
}

function weiXinPay() {
  console.log("pay start");
  device.vibrate(6000);
  device.setBrightness(255);
  sleep(6000);
  let key = device.model;
  console.log(state.mockPoints[key]);
  if (!state.mockPoints[key]) return;
  let payPoints = state.mockPoints[key];
  for (let i = 0; i < payPoints.length; i++) {
    let _point = payPoints[i];
    simulateClick(_point);
    sleep(1000);
  }
}

function screenIsLoadedWithOcr({ callback, wait } = {}) {
  event$.on(eventKeys.orc, ({ action }) => {
    // 如果有正在运行的OCR线程，先停止它
    if (state.orcThread) {
      state.orcThread.interrupt();
      state.orcThread.join(1000);
      console.log(threads.currentThread(), state.orcThread, "orcThread线程");
      state.orcThread = null;
    }

    // 如果action为false，只停止线程，不启动新的
    if (action === false) {
      console.log("停止OCR线程");
      return;
    }

    console.log("启动OCR线程");
    state.currentOrcInfo = [];
    state.orcThread = startThread({
      fn: () => {
        while (true) {
          let { currentScreenOcr } = getOrcScreen();
          state.currentOrcInfo = currentScreenOcr;
          // console.log(state.currentOrcInfo, '匹配当前的 orc内容')
          if (
            currentScreenOcr.includes("微信支付") ||
            currentScreenOcr.includes("支付环境存在风险")
          ) {
            console.log("开始支付");
            weiXinPay();
            break;
          }
          let POPMARTLoading =
            currentScreenOcr.some((item) => item.includes("POP M")) ||
            currentScreenOcr.some((item) => item.includes("MAR")); //popmark 红色loading
          // 兼容loading 过长 无法点击
          if (POPMARTLoading && state.loopPlaceOrderStep === orderResultStep) {
            if (state.popLodingstartTime === 0) {
              state.popLodingstartTime = Date.now();
            }
            let keepTime = Date.now() - state.popLodingstartTime;
            console.log("poploading持续的时间:", keepTime, state.loopPlaceOrderStep);
            if (keepTime > 9500 && keepTime < 99999) {
              console.log("点击左上角返回按钮");
              state.widgetDisabled = ''
              handleSimulateClick({
                widget: id("gy").findOne(state.widghtFindTime),
              });
              state.loopPlaceOrderStep = rebackBuyMethodPageStep;
              loopPlaceOrder();
            }
          }
          let hasSureBtn =
            currentScreenOcr.includes("确定") ||
            currentScreenOcr.some((item) => item.includes("确定"));
          if (hasSureBtn) {
            if (state.sureBtnStartTime === 0) {
              state.sureBtnStartTime = Date.now();
            }
            let keepTime = Date.now() - state.sureBtnStartTime;
            console.log("确定按钮持续的时间:", keepTime, state.loopPlaceOrderStep);
            if (keepTime > 200 && keepTime < 99999) {
              state.widgetDisabled = ''
              state.widghtFindTime = 200
              javaSetTimeout(() => {
                state.widghtFindTime = 10000;
              }, 50);
              sleep(100)
              state.loopPlaceOrderStep = "";
              loopPlaceOrder();
            }
          }
        }
      },
    });
  });
}

function getOrcScreen({ callback } = {}) {
  let startTime = Date.now();
  let img = images.captureScreen();
  let region = [0, 0.2, -1, 0.6];
  let currentScreenOcr = ocr(img, region).map((i) => i.trim());
  img.recycle();
  let endTime = Date.now();
  let elapsedTime = endTime - startTime;
  let generateId = startTime + "-" + elapsedTime;
  callback && callback();
  return { currentScreenOcr, elapsedTime, startTime, generateId, endTime };
}

// 初始化配置
function initConfig() {
  screenIsLoadedWithOcr();
  const storageState = storage_state.get("ppmt_state")
    ? JSON.parse(storage_state.get("ppmt_state"))
    : {};
  state.point = storage.get("widghtPoint")
    ? JSON.parse(storage.get("widghtPoint"))
    : {};
  const state_keys = [
    "hasStandard",
    "buyMethod",
    "addOne",
    "refreshWithoutFeel",
    "breakLimit",
    "loopBuyMethodTime",
    "loopPlaceOrderKeepTime",
    "loopPlaceOrderKeepTimeWhenBreak",
  ];
  state_keys.forEach((key) => {
    if (storageState.hasOwnProperty(key)) {
      state[key] = storageState[key];
    }
  });
  console.log(
    {
      hasStandard: state.hasStandard,
      buyMethod: state.buyMethod,
      addOne: state.addOne,
      addOne: state.addOne,
      breakLimit: state.breakLimit,
      loopBuyMethodTime: state.loopBuyMethodTime,
      loopPlaceOrderKeepTime: state.loopPlaceOrderKeepTime,
      loopPlaceOrderKeepTimeWhenBreak: state.loopPlaceOrderKeepTimeWhenBreak,
    },
    "初始化数据state============"
  );

  let mockPoints = {
    PDSM00: [
      { x: [447, 654], y: [1774, 1845] }, //2
      { x: [447, 654], y: [1774, 1845] }, // 2
      { x: [447, 654], y: [2232, 2307] }, // 0
      { x: [807, 955], y: [1774, 1845] }, // 3
      { x: [447, 654], y: [2232, 2307] }, // 0
      { x: [107, 249], y: [2081, 2153] }, // 7
    ], // oppoReno5pro
    PJX110: [
      { x: [927, 1121], y: [2040, 2125] }, //3
      { x: [927, 1121], y: [2040, 2125] }, //3
      { x: [520, 763], y: [2592, 2670] }, // 0
      { x: [116, 346], y: [2220, 2320] }, // 4
      { x: [520, 763], y: [2040, 2125] }, // 2
      { x: [927, 1121], y: [2403, 2496] }, // 9
    ], // 1+ 3ace
    GM1915: [
      { x: [628, 859], y: [2283, 2409] }, //2
      { x: [628, 859], y: [2283, 2409] }, //2
      { x: [628, 859], y: [2913, 2991] }, // 0
      { x: [1071, 1171], y: [2283, 2409] }, // 3
      { x: [628, 859], y: [2913, 2991] }, //0
      { x: [119, 372], y: [2695, 2795] }, // 7
    ],
    "VOG-AL00": [
      { x: [430, 660], y: [1765, 1833] }, //2
      { x: [430, 660], y: [1765, 1833] }, // 2
      { x: [430, 660], y: [2219, 2300] }, // 0
      { x: [810, 1000], y: [1765, 1833] }, // 3
      { x: [430, 660], y: [2219, 2300] }, // 0
      { x: [95, 300], y: [2065, 2150] }, // 7
    ],
  };
  state.mockPoints = mockPoints;
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
