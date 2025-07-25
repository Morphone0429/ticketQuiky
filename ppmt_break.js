
let state = {
  loopBuyMethodTime: 3000,
  widghtFindTime: 3000,  //查找widght的最大时间
  hasStandard: true, //是否有选择规格
  refreshWithoutFeel: false,  // 是否无感刷新
  buyMethod: 'home', // home | mark  // 选择的购买方式
  currentMethod: '', // 当前的购买方式
  addOne: false //是否数量+1
}
// isNotEmpty()
const eventKeys = {
  jump: 'jump',
  start: 'start'
}

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

const event = events.emitter();

function handlerIntroductionThread() {
  event.on(eventKeys.start, ({ mode }) => {
    if (mode === 'start') {
      handleQuickBuyClick({
        fn: () => {
          event.emit(eventKeys.jump, {
            mode: 'init',
            from: 'introduction',
          });
        }
      })
    }
  });
}



function handlerBuyMethodThread() {
  event.on(eventKeys.start, ({ mode }) => {

  });
  event.on(eventKeys.jump, ({ mode, from }) => {
    if (mode === 'init' && from === 'introduction') {
      initBuyMethod()
      sleep(state.loopBuyMethodTime)
      loopBuyMethod()
    }
  });
}

function handleQuickBuyClick({ fn } = {}) {
  let quickBuyButton = findTextViewWidget({ text: "立即购买" })
  if (quickBuyButton) {
    quickBuyButton.click()
  }
  fn && fn()
}



function initBuyMethod() {
  patchPageFeature({
    text: '选择规格',
    callback: () => {
      console.log('选择规格-----> 一端')
      let standardWholeBtn = textContains("整盒含").findOne(state.widghtFindTime)
      if (standardWholeBtn) {
        standardWholeBtn.click()
        state.initStandardWhole = true
      }
    },
    sync: state.hasStandard
  })
  patchPageFeature({
    text: '购买方式',
    callback: () => {
      console.log('选择购买方式')
      let sendHomeBtn = findTextViewWidget({ text: '送到家' })
      let goMarketBtn = findTextViewWidget({ text: '到店取' })
      if (!sendHomeBtn || !goMarketBtn) return
      state.sendHomeBtnPoint = { x: sendHomeBtn.bounds().centerX(), y: sendHomeBtn.bounds().centerX() }
      state.goMarketBtnPoint = { x: goMarketBtn.bounds().centerX(), y: goMarketBtn.bounds().centerX() }
      console.log(sendHomeBtn)
      if (state.buyMethod === 'home') {
        sendHomeBtn.click()
        state.currentMethod = 'home'
      }
      if (state.buyMethod === 'mark') {
        goMarketBtn.click()
        state.currentMethod = 'mark'
      }
    },
    sync: true
  })
  patchPageFeature({
    text: '选择预售批次',
    callback: () => {
      console.log('选择预售批次')
    }
  })

  // patchPageFeature({
  //   text: '选择颜色',
  //   callback: () => {
  //     console.log('选择颜色')

  //   }
  // })
}

function loopBuyMethod() {
  if (state.refreshWithoutFeel) {
    eventTimeControl({
      fn: () => {
        handleQuickBuyClick()
      },
      time: state.loopBuyMethodTime,
      endFn: loopBuyMethod
    })
  } else {
    console.log(
      '当前的购买方式:', state.currentMethod,
      '将要点击的购买方式:', state.currentMethod === 'home' ? '到店取' : '送到家'
    )
    let sendHomeBtn = findTextViewWidget({ text: '送到家' })
    let goMarketBtn = findTextViewWidget({ text: '到店取' })
    if (!sendHomeBtn || !goMarketBtn) return
    // className("android.widget.TextView").text("已售罄").findOne()
    if (state.currentMethod === 'home') {
      eventTimeControl({
        fn: () => {
          // goMarketBtn.click()
          handleSimulateClick(state.goMarketBtnPoint)
          state.currentMethod = 'mark'
        },
        time: state.loopBuyMethodTime,
        endFn: loopBuyMethod
      })
    } else if (state.currentMethod === 'mark') {
      eventTimeControl({
        fn: () => {
          // sendHomeBtn.click()
          handleSimulateClick(state.sendHomeBtnPoint)
          state.currentMethod = 'home'
        },
        time: state.loopBuyMethodTime,
        endFn: loopBuyMethod
      })
    }
  }
}


function handleSimulateClick({
  x, y, duration
}) {
  const _duration = duration || 1
  press(x, y, _duration)
}


function handlerPlaceOrderThread() {
  event.on(eventKeys.start, ({ mode }) => {

  });

  event.on(eventKeys.jump, ({ mode }) => {

  });
}


function eventTimeControl({ fn, time = 0, endFn }) {
  let startTime = Date.now();
  let flag = fn && fn()
  if (flag === 'break') return
  let endTime = Date.now()
  let duration = endTime - startTime
  let sleepTime = Math.max(time - duration, 0)
  sleep(sleepTime)
  endFn && endFn()
}


function startThread({ threadKey, fn }) {
  let t = threads.start(function () {
    fn()
  });
  threadKey && setInterval(() => { }, 1000);
  t.waitFor()
  return t
}

function patchPageFeature({ callback, text, timeOut, sync }) {
  if (sync) {
    callback()
  } else {
    let runThread = true;
    startThread({
      fn: () => {
        while (runThread) {
          let feature = className("android.widget.TextView").text(text).exists()
          if (feature) {
            callback && callback()
            break
          }
        }
      }
    })
    javaSetTimeout(() => { runThread = false }, timeOut || state.widghtFindTime)
  }

}

function initConfug() {

}

function findTextViewWidget({ text }) {
  return className("android.widget.TextView").text(text).findOne(state.widghtFindTime)
}
function main() {
  initConfug()
  const introductionThread = startThread({ threadKey: 'introductionthread', fn: handlerIntroductionThread })
  const buyMethodThread = startThread({ threadKey: 'buyMethodthread', fn: handlerBuyMethodThread })
  const placeOrderThread = startThread({ threadKey: 'placeOrderthread', fn: handlerPlaceOrderThread })
  setTimeout(() => {
    event.emit(eventKeys.start, {
      mode: 'start',
      from: 'init'
    });
  }, 0);
}


main()