auto.waitFor();


let config = {
  TARGET_GROUP_NAME: 'A',
  KEYWORD: '到店取',
  CHECK_INTERVAL: 1500
}


let utils = {
  targetAppName: '微信',
  isSystemScreen: () => { return currentPackage() === "com.android.systemui" },
  isHomeScreen: () => {
    return currentPackage() === "com.android.launcher" && currentActivity().includes("launcher");
  },
  isWeChatScreen: () => {
    let wechatPackage = "com.tencent.mm"; // 微信包名
    let wechatActivities = [
      ".ui.LauncherUI",      // 主界面
      ".plugin."             // 小程序/插件
    ];
    console.log({ currentPackage: currentPackage(), currentActivity: currentActivity() })
    return currentPackage() === wechatPackage && wechatActivities.some(act => currentActivity().includes(act));
  },
  handleoOrcScreen: (wait) => {
    let _wait = wait ? wait : 200;
    sleep(_wait); // 绝不能删除  不然orc需要一定时间 机型不同 时间会有所差异
    let img = images.captureScreen();
    let region = [0, 0.2, -1, 0.6];
    let currentScreenOcr = ocr(img, region);
    img.recycle();
    return currentScreenOcr;
  }
}


preMain()


// test()
// function test() {
//   console.log('test', currentPackage(), currentActivity())
// }

function preMain() {
  device.wakeUpIfNeeded();
  requestScreenCapture();
  function unlockDevice({ callback }) {
    console.log({
      isScreenOn: device.isScreenOn(),
      currentPackage: currentPackage(),
      currentActivity: currentActivity(),
      isHomeScreen: utils.isHomeScreen(),
      isWeChatScreen: utils.isWeChatScreen()
    }, 'isScreenOn');
    // 先判断是否还在锁屏界面
    if (device.isScreenOn() && (utils.isHomeScreen() || utils.isWeChatScreen())) {
      // callback()
    }

    return
    try {
      let trySwipeUp = () => {
        let width = device.width;
        let height = device.height;
        swipe(width / 2, height - 100, width / 2, 100, 800);
      };
      trySwipeUp();
      sleep(1500);
      // 如果还在锁屏界面，尝试更长的滑动距离
      if (device.isScreenOn() && !(utils.isHomeScreen() || utils.isWeChatScreen())) {
        trySwipeUp();
        sleep(1000);
      }
    } catch (e) {
      console.error("滑动解锁失败:" + e);
    }
    // 最终检查
    if (!utils.isHomeScreen() && !utils.isWeChatScreen()) {
      throw new Error("解锁失败，请手动检查设备锁屏设置");
    } else {
      console.log("解锁成功");
      callback()
    }
  }

  function launchApp({ appName, callback }) {
    // 检查是否是微信且已经在微信中
    if (utils.isWeChatScreen()) {
      console.log("已经在微信中，无需重新打开");
      callback()

    }
    // 回到主屏幕
    home();
    sleep(1000);
    // 在应用列表或桌面查找应用图标
    let appFound = text(appName).findOne(3000);
    if (appFound) {
      // 如果找到应用图标，点击它
      appFound.click();
      callback()
    } else {
      // 如果没有找到，尝试通过包名启动
      let packageName = getAppPackageName(appName);
      if (packageName) {
        app.launch(packageName);
        callback()
      } else {
        toast("未能找到应用: " + appName);
        return false;
      }
    }
  }

  function enterWeChat({ callback }) {
    const orcContent = utils.handleoOrcScreen()
    console.log(orcContent, 'handleoOrcScreen')
    if (!orcContent.includes(utils.targetAppName)) {
      sleep(2000)
      enterWeChat({ callback })
    }
    callback()
  }


  unlockDevice({
    callback: () => {
      launchApp({
        appName: utils.targetAppName,
        callback: () => {
          enterWeChat({
            callback: () => {
              console.log('当前页面是微信聊天列表页面')
            }
          })
        }
      });

    }
  });

}





function getAppPackageName(appName) {
  // 常见应用的包名映射
  let appMap = {
    "微信": "com.tencent.mm",
    "QQ": "com.tencent.mobileqq",
    "支付宝": "com.eg.android.AlipayGphone",
    "设置": "com.android.settings"
    // 可以继续添加更多应用...
  };
  return appMap[appName] || null;
}






