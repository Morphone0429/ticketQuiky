let state = {
  isPagePatching: false,
  currentPage: '',
  stagnationTime: '',
  clickCount: 0,
  widghtFindTime: 3000, //查找widght的最大时间
  hasStandard: true, //是否有选择规格
  buyMethod: "mark", // home | mark  // 选择的购买方式
  addOne: true, //是否数量+1
  refreshWithoutFeel: true, // 是否无感刷新
  breakLimit: true,
  oopBuyMethodTime: 600,
  loopPlaceOrderKeepTime: 3000, // 循环确认订单流程的最大时长
  loopPlaceOrderKeepTimeWhenBreak: 1350, // 1350
};


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

let utils = {
  logWithLevel: ({ tag, msg } = {}) => {
    var prefix = '[' + tag + '] ';
    console.log(prefix, msg);
  }
  checkTextViewWidgetIsExists: (text) => {
    return className('android.widget.TextView').text(text).exists();
  }

  trySwipeUp: ({ fn } = {}) => {
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
  findTextViewWidget: ({ text, findMaxTime } = {}) => {
    return className("android.widget.TextView")
      .text(text)
      .findOne(findMaxTime ? findMaxTime : state.widghtFindTime);
  }
  startThread: ({ threadKey, fn } = {}) => {
    let t = threads.start(fn);
    threadKey && setInterval(() => { }, 1000);
    t.waitFor();
    return t;
  }
}


function handleSimulateClick({
  widget,
  callback,
  error,
  widgetKey = "",
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
    console.log("当前点击的widget:", {
      widget: widget.text() ? widget.text() : widget.center(),
      widgetKey,
      currentPage: state.currentPage,
    });
    widget.click();
  } else {
    if (state.point[widgetKey]) {
      const x = state.point[widgetKey].x;
      const y = state.point[widgetKey].y;
      if (x && y) {
        press(x, y, 1);
      }
    } else {
      error && error();
    }
  }
  state.clickCount = state.clickCount + 1;
  sleep(sleepTime);
  callback && callback();
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
      handleSureClick();
      return "break";
    }
    endTime = Date.now();
  }
}



function initBuyMethod() {
  // 选择规格 同步取决于是否有选择规格
  if (state.hasStandard) {
    console.log("选择规格-----> 一端");
    handleSimulateClick({
      widget: textContains("整盒含").findOne(state.widghtFindTime * 5),
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
    },
  });
}


function main() {
  initConfig();
  startTheRoadToKing();
}

function startTheRoadToKing() {
  if (!state.isPagePatching) return
  if (utils.checkTextViewWidgetIsExists('确认信息并支付') || utils.checkTextViewWidgetIsExists('确认订单')) {
    state.isPagePatching = false

  }
  if (!state.isPagePatching) return
  if (utils.checkTextViewWidgetIsExists('购买方式') || utils.checkTextViewWidgetIsExists('数量')) {
    state.isPagePatching = false
    initBuyMethod()
  }
  if (!state.isPagePatching) return
  if (utils.checkTextViewWidgetIsExists('购物车') || utils.checkTextViewWidgetIsExists('立即购买')) {
    state.isPagePatching = false
    handleSimulateClick({
      widget: findTextViewWidget({ text: "立即购买", findMaxTime: 10 * 1000, }),
      callback: () => {
        state.currentPage = buyMethodPage;
        event$.emit(eventKeys.patchPage, {
          page: buyMethodPage,
          from: introductionPage,
        });
      },
    });
  }
  if (!state.isPagePatching) return
  if (textContains('距离开售时间').exists()) {
    if (textContains("距离开售时间还剩00:00").exists()) {
      if (!state.countdownErrorStartTime) {
        state.countdownErrorStartTime = Date.now();
      }
      if (Date.now() - state.countdownErrorStartTime > 2000) {
        state.countdownErrorStartTime =
          state.countdownErrorStartTime + 24 * 60 * 60 * 1000;
        utils.trySwipeUp();
      }
    }
  }
  patchPage()
}

function initConfig() {
  requestScreenCapture();
  state.isPagePatching = true;
  const storageState = storage_state.get('ppmt_state') ? JSON.parse(storage_state.get('ppmt_state')) : {};
  state.point = storage.get('widghtPoint') ? JSON.parse(storage.get('widghtPoint')) : {};
  const state_keys = ['hasStandard', 'buyMethod', 'addOne', 'refreshWithoutFeel', 'breakLimit', 'loopBuyMethodTime', 'loopPlaceOrderKeepTime', 'loopPlaceOrderKeepTimeWhenBreak'];
  state_keys.forEach(key => {
    if (storageState.hasOwnProperty(key)) {
      state[key] = storageState[key];
    }
  });
  utils.logWithLevel({
    tag: '初始化数据state',
    msg: {
      hasStandard: state.hasStandard,
      buyMethod: state.buyMethod,
      addOne: state.addOne,
      addOne: state.addOne,
      breakLimit: state.breakLimit,
      loopBuyMethodTime: state.loopBuyMethodTime,
      loopPlaceOrderKeepTime: state.loopPlaceOrderKeepTime,
      loopPlaceOrderKeepTimeWhenBreak: state.loopPlaceOrderKeepTimeWhenBreak,
    },
  });
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
    'VOG-AL00': [
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
