const path = "/sdcard/脚本/ppmt_break0727.js";

try {
  floaty.closeAll();
} catch (e) {
  log("关闭旧窗口异常：" + e);
}

const sw = device.width;
const sh = device.height;
log("屏幕尺寸: " + sw + " × " + sh);
log("创建悬浮窗...");

let win = floaty.window(
  <frame id="root" bg="#01000000">
    <vertical>
      {/* 可拖动标题 */}
      <text
        id="drag"
        text="ppmt抢购助手"
        textSize="16sp"
        textColor="#FFFFFF"
        bg="#CC000000"
        padding="8"
        gravity="center"
        w="*"
      />
      {/* 内容区 */}
      <vertical bg="#80000000" padding="10 5 10 10">
        <horizontal>
          <button
            id="mainScript"
            text="开始"
            layout_weight="1"
            textColor="#FFFFFF"
            bg="#77ffffff"
            height="32dp"
            textSize="14sp"
            padding="2dp"
            marginRight="8dp"
          />

          <button
            id="restartScript"
            text="重启"
            layout_weight="1"
            textColor="#FFFFFF"
            bg="#804CAF50"
            height="32dp"
            textSize="14sp"
            padding="2dp"
            marginRight="8dp"
          />

          <button
            id="closeDrawer"
            text="关闭弹窗"
            layout_weight="1"
            textColor="#FFFFFF"
            bg="#77ffffff"
            height="32dp"
            textSize="14sp"
            padding="2dp"
          />
        </horizontal>

        <horizontal>
          <text
            text="选择规格"
            textSize="14sp"
            textColor="#FFFFFF"
            marginTop="3"
          />
          <radiogroup id="specification" orientation="horizontal">
            <radio
              id="bigBaby"
              text="大娃"
              textColor="#FFFFFF"
              scaleX="0.85"
              scaleY="0.85"
              checked="true"
            />
            <radio
              id="wholeBaby"
              text="端(整盒)"
              textColor="#FFFFFF"
              scaleX="0.85"
              scaleY="0.85"
            />
          </radiogroup>
        </horizontal>
        <horizontal>
          <text
            text="选择购买方式"
            textSize="14sp"
            textColor="#FFFFFF"
            marginTop="3"
          />
          <radiogroup id="mode" orientation="horizontal">
            <radio
              id="home"
              text="(送到家)"
              textColor="#FFFFFF"
              scaleX="0.85"
              scaleY="0.85"
              checked="true"
            />
            <radio
              id="mark"
              text="(到店取)"
              textColor="#FFFFFF"
              scaleX="0.85"
              scaleY="0.85"
            />
          </radiogroup>
        </horizontal>
        <horizontal>
          <text
            text="选择数量"
            textSize="14sp"
            textColor="#FFFFFF"
            marginTop="3"
          />
          <radiogroup id="count" orientation="horizontal">
            <radio
              id="one"
              text="1"
              textColor="#FFFFFF"
              scaleX="0.85"
              scaleY="0.85"
              checked="true"
            />
            <radio
              id="two"
              text="2"
              textColor="#FFFFFF"
              scaleX="0.85"
              scaleY="0.85"
            />
          </radiogroup>
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
            />
          </radiogroup>
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
            id="speedText0"
            text="200 ms"
            textSize="14sp"
            textColor="#ffffff"
            marginTop="3"
          />
        </horizontal>
        <seekbar id="speed" max="1000" progress="200" progressTint="#2196F3" />
        <horizontal>
          <text
            text="确认信息并支付速度"
            textSize="14sp"
            textColor="#FFFFFF"
            marginTop="3"
            marginRight="6"
          />
          <text
            id="speedText0"
            text="200 ms"
            textSize="14sp"
            textColor="#ffffff"
            marginTop="3"
          />
        </horizontal>
        <seekbar id="speed" max="1000" progress="200" progressTint="#2196F3" />
      </vertical>
    </vertical>
  </frame>
);
log("悬浮窗对象已创建 ✔");
win.setPosition(0, 200);
log("初始位置已设置 ✔");
log("win.count: " + win.count);
log("win.speed: " + win.speed);
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
console.log(win.mainScript.getText());
win.mainScript.on("click", () => {
  setConfig();
    let currentText = win.mainScript.getText();
    let targetText = currentText === "开始" ? "停止" : "开始";
    let stopColor = "#77ffffff";
    let runColor = "#FF0000";
    let newColor =
      currentText === "开始"
        ? colors.parseColor(runColor)
        : colors.parseColor(stopColor);
    win.mainScript.setText(targetText);
    win.mainScript.setBackgroundColor(newColor);
    win.closeDrawer.setEnabled(currentText === "开始" ? false : true);
    currentText === "开始"
      ? (execution = engines.execScriptFile(path))
      : execution && execution.getEngine().forceStop();
});

win.closeDrawer.on("click", () => {
  if (execution) {
    execution.getEngine().forceStop();
  }
  engines.myEngine().forceStop();
});

function setConfig() {
  console.log({
    bigBaby: win.bigBaby.checked,
    wholeBaby: win.wholeBaby.checked,
    mark: win.mark.checked,
    home: win.home.checked,
    one: win.one.checked,
    two: win.two.checked,
    refreshWithoutFeel_true: win.refreshWithoutFeel_true.checked,
    refreshWithoutFeel_false: win.refreshWithoutFeel_false.checked,
    breakLimit_true: win.breakLimit_true.checked,
    breakLimit_false: win.breakLimit_false.checked,
  });
  const storage = storages.create("ppmt_state");
  let storageState = {
    hasStandard: win.wholeBaby.checked,
    buyMethod: win.home.checked ? "home" : "mark",
    addOne: win.two.checked,
    refreshWithoutFeel: win.refreshWithoutFeel_true.checked,
    breakLimit: win.breakLimit_true.checked,
  };

  storage.put("ppmt_state", JSON.stringify(storageState));
}

setInterval(() => {}, 1000);
