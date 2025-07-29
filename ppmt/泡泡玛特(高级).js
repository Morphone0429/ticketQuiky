const path = "/sdcard/脚本/ppmt_break.js";

try {
  floaty.closeAll();
} catch (e) {
  log("关闭旧窗口异常：" + e);
}

const sw = device.width;
const sh = device.height;
log("屏幕尺寸: " + sw + " × " + sh);
log("创建悬浮窗...");
const storage = storages.create("ppmt_state");
let btnTextConfig = {
  have_home: "端到家",
  have_market: "端到店",
  no_home: "大娃到家",
  no_market: "大娃到店",
  have_home_more: "端到家2",
  have_market_more: "端到店2",
  no_home_more: "大娃到家2",
  no_market_more: "大娃到店2",
};

let seekbarMap = {
  loopBuyMethodTime: {
    max: 3000,
    min: 100,
    default: 1300,
    progress: 0,
  },
  loopPlaceOrderKeepTime: {
    max: 6200,
    min: 800,
    default: 3500,
    progress: 0,
  },
  loopPlaceOrderKeepTimeWhenBreak: {
    max: 2980,
    min: 100,
    default: 1700,
    progress: 0,
  },
};

var win = floaty.window(
  <frame id="root" bg="#01000000">
    <vertical>
      {/* 可拖动标题 */}
      <text
        id="drag"
        text="🔥老天保佑金山银山💰🔥"
        textSize="16sp"
        textColor="#FFFFFF"
        bg="#CC000000"
        padding="8"
        gravity="center"
        w="*"
      />
      {/* 内容区  '#80000000'*/}
      <vertical bg="#80000000" padding="10 5 10 10">
        <horizontal>
          <button
            id="have_home"
            text={btnTextConfig.have_home}
            textSize="12sp"
            w="66"
            height="32dp"
            bg="#000000"
            textColor="#FFFFFF"
            margin="2"
            padding="2"
          />
          <button
            id="have_market"
            text={btnTextConfig.have_market}
            textSize="12sp"
            w="66"
            height="32dp"
            bg="#000000"
            textColor="#FFFFFF"
            margin="2"
            padding="2"
          />
          <button
            id="no_home"
            text={btnTextConfig.no_home}
            textSize="12sp"
            w="66"
            height="32dp"
            bg="#000000"
            textColor="#FFFFFF"
            margin="2"
            padding="2"
          />
          <button
            id="no_market"
            text={btnTextConfig.no_market}
            textSize="12sp"
            w="66"
            height="32dp"
            bg="#000000"
            textColor="#FFFFFF"
            margin="2"
            padding="2"
          />
        </horizontal>
        <horizontal>
          <button
            id="have_home_more"
            text={btnTextConfig.have_home_more}
            textSize="12sp"
            w="66"
            height="32dp"
            bg="#000000"
            textColor="#FFFFFF"
            margin="2"
            padding="2"
          />
          <button
            id="have_market_more"
            text={btnTextConfig.have_market_more}
            textSize="12sp"
            w="66"
            height="32dp"
            bg="#000000"
            textColor="#FFFFFF"
            margin="2"
            padding="2"
          />
          <button
            id="no_home_more"
            text={btnTextConfig.no_home_more}
            textSize="12sp"
            w="66"
            height="32dp"
            bg="#000000"
            textColor="#FFFFFF"
            margin="2"
            padding="2"
          />
          <button
            id="no_market_more"
            text={btnTextConfig.no_market_more}
            textSize="12sp"
            w="66"
            height="32dp"
            bg="#000000"
            textColor="#FFFFFF"
            margin="2"
            padding="2"
          />
        </horizontal>

        <horizontal>
          <text
            text="原地刷新"
            textSize="14sp"
            textColor="#FFFFFF"
            marginTop="3"
          />
          <radiogroup id="refreshWithoutFeel" orientation="horizontal">
            <radio
              id="refreshWithoutFeel_true"
              text="是"
              textColor="#FFFFFF"
              scaleX="0.85"
              scaleY="0.85"
              checked="true"
            />
            <radio
              id="refreshWithoutFeel_false"
              text="否"
              textColor="#FFFFFF"
              scaleX="0.85"
              scaleY="0.85"
              marginRight="32"
            />
          </radiogroup>
          <text
            text="下列按钮长按生效"
            textSize="10sp"
            textColor="#FFFFFF"
            marginTop="3"
          />
        </horizontal>
        <horizontal>
          <text
            text="破盾模式"
            textSize="14sp"
            textColor="#FFFFFF"
            marginTop="3"
          />
          <radiogroup id="breakLimit" orientation="horizontal">
            <radio
              id="breakLimit_true"
              text="是"
              textColor="#FFFFFF"
              scaleX="0.85"
              scaleY="0.85"
              checked="true"
            />
            <radio
              id="breakLimit_false"
              text="否"
              textColor="#FFFFFF"
              scaleX="0.85"
              scaleY="0.85"
            />
          </radiogroup>
          <button
            id="resetConfig"
            text="重置设置"
            layout_weight="1"
            textColor="#FFFFFF"
            bg="#2196F3"
            height="22dp"
            textSize="10sp"
            padding="2dp"
            marginRight="4"
          />
          <button
            id="closeDrawer"
            text="关闭弹窗"
            layout_weight="1"
            textColor="#FFFFFF"
            bg="#CCFF0000"
            height="22dp"
            textSize="10sp"
            padding="2dp"
          />
        </horizontal>
        <horizontal>
          <text
            text="购买方式刷新速度"
            textSize="14sp"
            textColor="#FFFFFF"
            marginTop="3"
            marginRight="6"
          />
          <text
            id="loopBuyMethodTimeText"
            textSize="14sp"
            textColor="#ffffff"
            marginTop="3"
          />
        </horizontal>
        <seekbar
          id="loopBuyMethodTime"
          max={seekbarMap.loopBuyMethodTime.max}
          progress="0"
          progressTint="#2196F3"
        />
        <horizontal>
          <text
            text="破盾速度"
            textSize="14sp"
            textColor="#FFFFFF"
            marginTop="3"
            marginRight="6"
          />
          <text
            id="loopPlaceOrderKeepTimeWhenBreakText"
            textSize="14sp"
            textColor="#ffffff"
            marginTop="3"
          />
          <text
            id="console"
            text="无障碍状态"
            textSize="12sp"
            textColor="#FFFFFF"
            marginTop="3"
            marginLeft="20"
          />
        </horizontal>
        <seekbar
          id="loopPlaceOrderKeepTimeWhenBreak"
          max={seekbarMap.loopPlaceOrderKeepTimeWhenBreak.max}
          progress="0"
          progressTint="#2196F3"
        />
        <horizontal>
          <text
            text="非破盾速度(常规)"
            textSize="14sp"
            textColor="#FFFFFF"
            marginTop="3"
            marginRight="6"
          />
          <text
            id="loopPlaceOrderKeepTimeText"
            textSize="14sp"
            textColor="#ffffff"
            marginTop="3"
          />
        </horizontal>
        <seekbar
          id="loopPlaceOrderKeepTime"
          max={seekbarMap.loopPlaceOrderKeepTime.max}
          progress="0"
          progressTint="#2196F3"
        />
      </vertical>
    </vertical>
  </frame>
);
log("悬浮窗对象已创建 ✔");
win.setPosition(0, 200);
log("初始位置已设置 ✔");

// ========== 自适应尺寸 ==========
ui.post(() => {
  const w = win.getWidth();
  const h = win.getHeight();
  win.setSize(w, h);
  log("自适应尺寸完成: " + w + " × " + h);
});

// ========== 拖动实现（带日志） ==========
let downX, downY, dx, dy;
win.drag.setOnTouchListener(function (v, e) {
  switch (e.getAction()) {
    case e.ACTION_DOWN:
      downX = e.getRawX();
      downY = e.getRawY();
      dx = win.getX();
      dy = win.getY();
      log("拖动开始: down(" + downX + "," + downY + ")");
      return true;
    case e.ACTION_MOVE:
      const newX = dx + (e.getRawX() - downX);
      const newY = dy + (e.getRawY() - downY);
      win.setPosition(newX, newY);
      return true;
    case e.ACTION_UP:
      log("拖动结束: 当前坐标(" + win.getX() + "," + win.getY() + ")");
      return true;
  }
  return false;
});
var execution = null;

function shortcutBtnClick({ type }) {
  console.log("选择的基本类型");
  setConfig({ type });
  let targetText = btnTextConfig[type];
  let stopColor = "#FF0000";
  let originColor = "#000000";
  if (win[type].getText() === targetText) {
    let newColor = colors.parseColor(stopColor);
    if (!files.exists(path)) {
      toast("脚本文件不存在: " + path);
      exit();
    }
    execution = engines.execScriptFile(path);
    win[type].setText("停止");
    win[type].setBackgroundColor(newColor);
    win.closeDrawer.setEnabled(false);
    for (let key in btnTextConfig) {
      let text = btnTextConfig[key];
      if (win[key] && type !== key) {
        win[key].setEnabled(false);
      }
    }
  } else {
    if (execution) {
      execution.getEngine().forceStop();
    }
    let newColor = colors.parseColor(originColor);
    win[type].setText(targetText);
    win[type].setBackgroundColor(newColor);
    win.closeDrawer.setEnabled(true);
    for (let key in btnTextConfig) {
      let text = btnTextConfig[key];
      if (win[key]) {
        win[key].setEnabled(true);
      }
    }
  }
}

win.have_home.click(() => {
  shortcutBtnClick({ type: "have_home" });
});

win.have_market.click(() => {
  shortcutBtnClick({ type: "have_market" });
});
win.no_home.click(() => {
  shortcutBtnClick({ type: "no_home" });
});
win.no_market.click(() => {
  shortcutBtnClick({ type: "no_market" });
});

// -----------more---------------
win.have_home_more.click(() => {
  shortcutBtnClick({ type: "have_home_more" });
});
win.have_market_more.click(() => {
  shortcutBtnClick({ type: "have_market_more" });
});
win.no_home_more.click(() => {
  shortcutBtnClick({ type: "no_home_more" });
});
win.no_market_more.click(() => {
  shortcutBtnClick({ type: "no_market_more" });
});

win.closeDrawer.on("long_click", () => {
  engines.stopAll();
  if (execution) {
    execution.getEngine().forceStop();
  }
  engines.myEngine().forceStop();
});
win.resetConfig.on("long_click", () => {
  storage.clear();
  seekbarInitSet();
  win.breakLimit_true.checked = true;
  win.refreshWithoutFeel_true.checked = true;
});

function setConfig({ type }) {
  let hasStandard = type.includes("have");
  let buyMethod = type.includes("home") ? "home" : "mark";
  let addOne = type.includes("more");
  console.log({
    hasStandard,
    buyMethod,
    addOne,
    refreshWithoutFeel_true: win.refreshWithoutFeel_true.checked,
    refreshWithoutFeel_false: win.refreshWithoutFeel_false.checked,
    breakLimit_true: win.breakLimit_true.checked,
    breakLimit_false: win.breakLimit_false.checked,
    loopBuyMethodTime: win.loopBuyMethodTime.progress,
    loopPlaceOrderKeepTime: win.loopPlaceOrderKeepTime.progress,
  });

  let storageState = {
    hasStandard,
    buyMethod,
    addOne,
    refreshWithoutFeel: win.refreshWithoutFeel_true.checked,
    breakLimit: win.breakLimit_true.checked,
    loopBuyMethodTime: win.loopBuyMethodTime.progress,
    loopPlaceOrderKeepTime: win.loopPlaceOrderKeepTime.progress,
    loopPlaceOrderKeepTimeWhenBreak:
      win.loopPlaceOrderKeepTimeWhenBreak.progress,
  };

  storage.put("ppmt_state", JSON.stringify(storageState));
}

function seekbarInitSet() {
  let ppmtState = storage.get("ppmt_state")
    ? JSON.parse(storage.get("ppmt_state"))
    : {};
  console.log(ppmtState);
  Object.keys(seekbarMap).forEach((key) => {
    console.log(key);
    win[key].progress = seekbarMap[key].default;
    win[`${key}Text`].setText(seekbarMap[key].default + " ms");

    if (ppmtState.hasOwnProperty(key)) {
      win[key].progress = ppmtState[key];
      win[`${key}Text`].setText(ppmtState[key] + " ms");
    }
    win[key].setOnSeekBarChangeListener({
      onProgressChanged: function (seekBar, progress, fromUser) {
        // console.log(seekBar, progress, fromUser, key);
        let newProgress = Math.max(seekbarMap[key].min, progress);
        win[`${key}Text`].setText(newProgress + " ms");
        ppmtState[key] = newProgress;
        storage.put("ppmt_state", JSON.stringify(ppmtState));
      },
    });
  });
}

function checkHamibot() {
  // 获取目标包名
  let targetPackage = app.getPackageName("Hamibot"); // 替换为你要检测的包名
  console.log(targetPackage, "targetPackage");
  // 检查无障碍服务是否启用（适用于 Auto.js 6.3+）
  let accessibilityManager = context.getSystemService("accessibility");
  let serviceList = accessibilityManager.getEnabledAccessibilityServiceList(
    android.accessibilityservice.AccessibilityServiceInfo.FEEDBACK_GENERIC
  );
  let isEnabled = false;
  for (let service of serviceList) {
    if (service.getId().toLowerCase().includes(targetPackage.toLowerCase())) {
      isEnabled = true;
      break;
    }
  }
  console.log(isEnabled);
  toast("Hamibot无障碍状态: " + (isEnabled ? "✅ 已开启" : "❌ 未开启"));
  !isEnabled && toast("请重启hamibot 无障碍服务");
  win.console.setText(`hamibot无障碍:${isEnabled ? "✅ 开启" : "❌ 关闭"}`);
}

ui.run(function () {
  checkHamibot();
});
// checkHamibot();

ui.run(function () {
  seekbarInitSet();
});

setInterval(() => {}, 1000);
