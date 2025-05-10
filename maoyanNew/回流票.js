// 检查无障碍服务是否已经启用，如果没有启用则跳转到无障碍服务启用界面，并等待无障碍服务启动；当无障碍服务启动后脚本会继续运行。
auto.waitFor();

let RMB = "¥";

//监控刷新票档时间间隔，单位：秒
let monitorIntervalSeconds = 2;

//WebHook地址，用于抢到了之后推送消息
let webHookNoticeUrl = "";
//是否响铃提醒
let isRingingBell = true;

//是否在测试调试，测试时不会点击支付按钮，避免生成过多订单
let isDebug = false;

//默认参数收集，如果设置了默认值，可以直接使用默认值，不再需要弹窗输入，加快脚本启动进程
let user = {
  //默认场次信息，例如：05-18,05-19
  // playEtcStr: "05-23,05-24,05-25,05-27,05-28",
  playEtcStr: "06-14",
  //默认最高票价，例如：800
  maxTicketPrice: "2700",
  //默认观演人，例如：观演人a,观演人b
  viewers: "楼超强,林彤彤",
};

let state = {
  isChooseTicketRangeing: false, //是否正在选择档位
};

main();

/**
 *  1. 选择票档页面,判断是否正常获取到节点
 */
function main() {
  getBaseInfo();
  loopScreen();
}

function loopScreen() {
  screenIsLoadedWithOcr({
    callback: (mode) => {
      if (mode === "loop_page0") {
        // 猫眼演出详情页面
        startPlayDetail();
      }
      if (mode === "loop_page1") {
        // 选择票档页面
        startChooseTicketRangePage();
      }
      if (mode === "loop_page2") {
        // 确认购票页面
        startSureTicketInfoThenToPay();
      }
    },
  });
}

// 猫眼演出详情
function startPlayDetail() {
  screenIsLoadedWithOcr({
    patchStep: "page0",
    callback: (mode) => {
      if (mode === "playDetailIKnown") {
        className("android.widget.TextView").text("知道了").findOne().click();
        startPlayDetail();
      }
      if (mode === "jumpToChooseTicketRange") {
        className("android.widget.TextView").text("立即预订").findOne().click();
        startChooseTicketRangePage();
        sleep(200);
      }
    },
  });
}

// 选择票档
function startChooseTicketRangePage() {
  screenIsLoadedWithOcr({
    patchStep: "page1",
    callback: (mode) => {
      console.log(mode);
      if (mode === "chooseTicketRange") {
        // 判断是否正常获取到节点
        initChooseTicketRangeWeight({
          callback: watchTicketRange,
        });
      }
    },
  });
}

// 监控选中票档页面
function watchTicketRange() {
  //出现刷新按钮时点击刷新
  threads.start(function () {
    log("刷新按钮自动点击线程已启动");
    while (true) {
      textContains("刷新").waitFor();
      textContains("刷新").findOne().click();
      log("点击刷新...");
      //避免点击过快
      sleep(100);
    }
  });

  threads.start(function () {
    console.log("开启票档扫描线程");
    while (true) {
      //当前还在票档界面，就持续扫描
      while (textContains(RMB).exists()) {
        cycleMonitor();
        //50ms扫描一次
        sleep(50);
      }
      sleep(1000);
    }
  });

  sleep(1000);
  while (true) {
    //只要当前在场次选择界面，就点击刷新余票信息
    if (
      className("android.widget.TextView").text("场次").exists() &&
      !textContains("数量").exists()
    ) {
      let playEtcArr = user.playEtcStr.split(",");
      for (let playEtc of playEtcArr) {
        if (isDebug) {
          log("刷新场次余票信息：" + playEtc);
        }
        //刷新余票信息
        textContains(playEtc).findOne().click();
        //点击一个场次，间隔时间后继续点击下一个场次
        sleep(monitorIntervalSeconds * 1000);
      }
    }
  }
}

function cycleMonitor() {
  //获取符合条件的票档数组
  let targetTickets = get_less_than_tickets();
  console.log({
    targetTickets,
    isChooseTicketRangeing: state.isChooseTicketRangeing,
  });
  for (let amount of targetTickets) {
    handleConfigTicket({ amount });
  }
}

function handleConfigTicket({ amount }) {
  if (state.isChooseTicketRangeing) return;
  log("开冲一个：" + amount);
  state.isChooseTicketRangeing = true; // 选择数量后点击确认
  let viewersArr = user.viewers.split(",");
  // 点击对应的挡位
  textContains(RMB + amount)
    .findOne()
    .click();
  // 增加人员数量
  plusViewers(viewersArr);
  if (!text(viewersArr.length + "份").exists()) {
    console.log("票数不足，继续刷新");
    state.isChooseTicketRangeing = false;
    return true;
  }
  loopClickSureBtn();
  startSureTicketInfoThenToPay();
}

function startSureTicketInfoThenToPay() {
  screenIsLoadedWithOcr({
    patchStep: "page2",
    callback: (mode) => {
      if (mode === "enterSureTicket") {
        state.isChooseTicketRangeing = false;
        chooseViewers();
        console.log(mode, "==============");
      }
    },
  });
}

function handleQuickPay() {
  if (isDebug) return;
  // if()
  console.log("准备点击 ");
  for (let cnt = 0; className("android.widget.Button").exists(); cnt++) {
    //直接猛点就完事了
    className("android.widget.Button").findOne().click();
    sleep(50);
    if (cnt % 20 == 0) {
      log("点支付次数:" + cnt + " 可继续等待或返回上一个界面继续刷新其他票档");
    }
    //TODO 出现类似【票已经卖完了】退出循环，继续刷新票档
  }
}

//选择对应的观演人
function chooseViewers() {
  let viewersArr = user.viewers.split(",");
  console.log(viewersArr);
  if (viewersArr.length !== 1 || user.viewers !== "默认人") {
    uncheckIfDefaultUserNotInViewer(viewersArr);
    for (let i = 0; i < viewersArr.length; i++) {
      let _viewer = viewersArr[i];
      let viewerObj = className("android.widget.TextView")
        .text(_viewer)
        .findOne();
      checkViewer(viewerObj);
    }
  }
}

// 循环点击寻找票档页面的 确认按钮
function loopClickSureBtn() {
  let attemptCnt = 0;
  let attemptMaxCnt = 200;
  while (text("确认").exists() && attemptCnt <= attemptMaxCnt) {
    let sureBtn = className("android.widget.TextView").text("确认").findOne();
    sureBtn.click();
    isDebug && console.log("点击确认");
    attemptCnt++;
  }
  if (
    attemptCnt >= attemptMaxCnt &&
    !className("android.widget.Button").exists()
  ) {
    isDebug && console.log("尝试次数过多，继续刷新");
    state.isChooseTicketRangeing = false;
    return false;
  }
}

// 选中票档后 增加人员数量
function plusViewers(viewersArr) {
  textContains("数量").waitFor();
  if (textMatches("\\d+份").exists()) {
    let curCount = parseInt(
      textMatches("\\d+份").findOne().text().replace("份", "")
    );
    //根据观演人数点+1
    let plusObj;
    for (let i = curCount; i < viewersArr.length; i++) {
      if (!plusObj) {
        let ticketNumParent = textMatches("/\\d+份/").findOne().parent();
        plusObj = ticketNumParent.children()[ticketNumParent.childCount() - 1];
      }
      plusObj.click();
    }
  }
  //plus点击后，等待数量组件框刷新，很重要
  textMatches("\\d+份").waitFor();
}

// 获取符合条件的票档数组
function get_less_than_tickets() {
  var targetTickets = [];
  textContains(RMB)
    .find()
    .forEach(function (btn) {
      if (btn.parent().childCount() >= 1 && !btn.text().includes("缺货")) {
        let match = btn.text().match(/\¥(\d+)/);
        let amount;
        if (match && (amount = parseInt(match[1])) < user.maxTicketPrice) {
          targetTickets.push(amount);
        }
      }
    });
  targetTickets.sort(function (a, b) {
    return a - b;
  });
  log("符合条件:" + unique(targetTickets));
  return unique(targetTickets);
}

/**
 * 初始化选择票档页面
 * 1. ¥ 存在说明正常获取到weight
 * 2. ¥ 不存在 说明布局元素无法正常获取 特殊处理 使用orc
 *   a. 存在 有货的票档 存在立马点击刷新,可以可以刷新当前页面
 *   b. 不存在有货的票档  需要随机点击某一票档 然后点击选择票档 再点击确认 可以可以刷新当前页面
 */
function initChooseTicketRangeWeight({ callback }) {
  if (isWeightFound(RMB)) {
    log("布局正常");
    callback();
  } else {
    log("布局不正常,刷新当前页面");
    getNodeWithFallback({
      callback: callback,
    });
  }
}

// 异常节点处理
function getNodeWithFallback({ callback }) {
  let orcResult = internalApiForPaddleOcr();
  let timeRangeArea = orcResult.filter((i) =>
    /周[一二三四五六日]/.test(i.label)
  ); // 场次
  // console.log({ orcResult, timeRangeArea }, "--------------");
  if (timeRangeArea.length === 0) {
    // sleep(200);
    getNodeWithFallback({ callback });
    return;
  }
  let ticketRangeArea = orcResult.filter(
    (i) => i.label.includes("元") || i.label.includes(RMB)
  ); // 票档
  // 情况1 只开了一场  场次会自动选中 且票档会有内容
  // 情况2 开了多场    场次不会自动选中  且票档需要选中场次后显示
  // console.log({ timeRangeArea, ticketRangeArea }, "票档");
  // 先处理场次
  handleSessionsChoose({
    timeRangeArea,
    callback: () => {
      console.log("场次已选中，开始处理票档部分");
      if (ticketRangeArea.length === 0) {
        // sleep(200);
        getNodeWithFallback({ callback });
        return;
      }
      // 确保ticketRangeArea 长度 > 0, 再处理票档
      handleTicketRange({
        ticketRangeArea,
        callback,
      });
    },
  });
}

// 处理场次
function handleSessionsChoose({ timeRangeArea, callback }) {
  if (timeRangeArea.length === 1) {
    callback();
    return;
  }
  let hasProd = timeRangeArea.find((i) => !i.label.includes("缺货"));
  console.log(hasProd);
  if (hasProd) {
    // 场次有货
    let point = getPoint({ index: 0, bounds: hasProd.bounds });
    click(point.x, point.y);
    callback();
  } else {
    // 场次没货
    let cur = timeRangeArea[0];
    let point = getPoint({ index: 0, bounds: cur.bounds });
    click(point.x, point.y);
    callback();
  }
}

// 处理票档
// 当场次 length === 1 时 会默认选中该场次，所以会有票档的orc信息
// length> 1 时  选中场次之后才会有票档的orc信息
function handleTicketRange({ ticketRangeArea, callback }) {
  let weights = [];
  for (let i = 0; i < ticketRangeArea.length; i++) {
    let cur = ticketRangeArea[i];
    // 缺货出现的次数
    let noProdNum = countSubstringOccurrences(cur.label, "缺货");
    // ¥出现的次数 代表一行中有几档票
    let rowTicketNum = countSubstringOccurrences(cur.label, RMB);
    let temp = splitByTicketType(cur.label);
    log({ noProdNum, rowTicketNum, temp });

    //可以明确一行最多两个票档选择;
    if (noProdNum === rowTicketNum) {
      log(temp, 1);
      // 这一行没有票
      for (let j = 0; j < temp.length; j++) {
        let _w = {
          hasProd: false,
          point: getPoint({ index: j, bounds: cur.bounds }),
        };
        weights.push(_w);
      }
    } else if (rowTicketNum > noProdNum) {
      // 这一行有票
      log(temp, 2);
      for (let j = 0; j < temp.length; j++) {
        let _w = {
          hasProd: !temp[j].includes("缺货"),
          point: getPoint({ index: j, bounds: cur.bounds }),
        };
        weights.push(_w);
      }
    }
  }
  // console.log(JSON.stringify(weights));
  let hasProd = weights.find((i) => i.hasProd); // 是否存在有货的票档
  if (hasProd) {
    // 存在，点击某一票档 进行缺货登记
    click(hasProd.point.x, hasProd.point.y);
    callback && callback();
  } else {
    // 不存在，点击某一票档 进行缺货登记
    let firstNoProd = weights[0];
    click(firstNoProd.point.x, firstNoProd.point.y);
    className("android.widget.TextView").text("缺货登记").findOne().click();
    className("android.view.View").clickable(true).depth(9).findOne().click();
    callback && callback();
  }
}

/**
 * 当默认人不在观演人列表中时，取消默认人的选中状态
 */
function uncheckIfDefaultUserNotInViewer(viewersArr) {
  let defaultUserObj = text("默认").findOne().parent().children()[1];
  let defaultUser = defaultUserObj.text();
  console.log(defaultUser);
  if (!viewersArr.includes(defaultUser)) {
    uncheckViewer(defaultUserObj);
  }
}

function checkViewer(viewerObj) {
  clickViewerCheckBox(viewerObj, true);
}

function uncheckViewer(viewerObj) {
  clickViewerCheckBox(viewerObj, false);
}

/**
 * 点击观演人勾选框
 * @param {viewerObj} 观演人姓名text所在的对象
 * @param {*} isChecked 当前目标操作是否为选中
 */
function clickViewerCheckBox(viewerObj, isChecked) {
  viewerObj
    .parent()
    .children()
    .forEach(function (child) {
      if (child.className() == "android.widget.Image") {
        //当前目标操作为选中 且 当前当前状态为未选中
        if (isChecked && child.text() == "wc0GRRGh2f2pQAAAABJRU5ErkJggg==") {
          console.log("选中观演人：" + viewerObj.text());
          child.click();
        }
        //当前目标操作为取消选中 且 当前当前状态为选中
        if (!isChecked && child.text() == "B85bZ04Z1b5tAAAAAElFTkSuQmCC") {
          console.log("取消选中观演人：" + viewerObj.text());
          child.click();
        }
      }
    });
}

function screenIsLoadedWithOcr({ patchStep, callback }) {
  let {
    playDetailScreen,
    playDetailIKnownScreen,
    chooseTicketRangeScreen,
    sureTicketScreen,
  } = handleoOrcScreen();

  function fallbackLogic() {
    console.log("----------------需要进行兜底吗？", {
      patchStep,
      playDetailScreen,
      playDetailIKnownScreen,
      chooseTicketRangeScreen,
      sureTicketScreen,
    });
    // if (patchStep === "makeSureOrder" && makeSureOrderScreen) {
    //   device.vibrate(200); //手机震动 可能抢到了
    // }
    // 兜底逻辑 没有找到 再多等待一会儿再查找
    // sleep(100);
    screenIsLoadedWithOcr({ patchStep, callback });
    return;
  }

  if (patchStep === "page0") {
    if (playDetailScreen) {
      // 实名制观影 我知道了按钮
      if (playDetailIKnownScreen) {
        callback("playDetailIKnown");
        return;
      }

      // 可以点击 跳转至选择票档
      if (!playDetailIKnownScreen) {
        callback("jumpToChooseTicketRange");
        return;
      }
    }
  }
  if (patchStep === "page1") {
    let currentScreenOrc = getScreenOrcInfo(100);
    // console.log(currentScreenOrc);
    if (
      chooseTicketRangeScreen &&
      currentScreenOrc.some((item) => item.includes("场次"))
    ) {
      // 选择票档
      callback("chooseTicketRange");
      return;
    }
  }
  if (patchStep === "page2") {
    if (sureTicketScreen) {
      // 确认购票
      callback("enterSureTicket");
      return;
    }
  }

  if (!patchStep) {
    if (playDetailScreen) {
      callback("loop_page0");
      return;
    }
    if (chooseTicketRangeScreen) {
      callback("loop_page1");
      return;
    }
    if (sureTicketScreen) {
      callback("loop_page2");
      return;
    }
  }

  fallbackLogic();
}

function handleoOrcScreen() {
  let playDetailScreen = isWeightFound("猫眼演出详情");
  let chooseTicketRangeScreen = isWeightFound("选择票档");
  let sureTicketScreen = isWeightFound("确认购票");
  let playDetailIKnownScreen = isWeightFound("知道了");
  return {
    playDetailScreen,
    playDetailIKnownScreen,
    chooseTicketRangeScreen,
    sureTicketScreen,
  };
}

// ocr获取节点信息
function internalApiForPaddleOcr() {
  // 指定是否用精简版模型, 速度较快, 默认为 true
  let useSlim = false;

  // CPU 线程数量, 实际好像没啥作用
  let cpuThreadNum = 4;

  let start = new Date();
  let img = captureScreen();
  let results = ocr.paddle.detect(img, { useSlim, cpuThreadNum });
  let c = Array.from(results).map((result) => {
    return {
      label: result.label,
      confidence: result.confidence,
      bounds: result.bounds,
    };
  });
  log(`识别结束, 耗时: ${new Date() - start}ms`);
  log(`识别结果: ${JSON.stringify(c)}`);
  // 回收图片
  img.recycle();
  return c;
}

// 判断节点是否存在
function isWeightFound(testDesc) {
  return textContains(testDesc).exists();
}

// 获取用户基础信息
function getBaseInfo() {
  let playEtcStr = user.playEtcStr ? user.playEtcStr : getPlayEtc(); //场次信息
  let playEtcArr = playEtcStr.split(",");
  let maxTicketPrice = user.maxTicketPrice
    ? user.maxTicketPrice
    : getMaxTicketPrice(); //最高票价
  let viewers = user.viewers ? user.viewers : getViewers();
  user.playEtcStr = playEtcStr;
  user.maxTicketPrice = maxTicketPrice;
  user.viewers = viewers;
  return {
    playEtcStr,
    playEtcArr,
    maxTicketPrice,
    viewers,
  };
}

//获取输入票价信息
function getMaxTicketPrice() {
  let ticketPrice = rawInput("请输入监控最高票价", "800");
  if (ticketPrice == null || ticketPrice.trim() == "") {
    alert("请输入监控最高票价!");
    return getMaxTicketPrice();
  }
  return ticketPrice;
}

//获取输入的场次信息
function getPlayEtc() {
  let playEtc = rawInput("请输入场次关键字(按照默认格式)", "05-18,05-19");
  if (playEtc == null || playEtc.trim() == "") {
    alert("请输入场次信息!");
    return getPlayEtc();
  }
  return playEtc;
}

//获取输入的观演人姓名
function getViewers() {
  let viewers = rawInput("请输入观演人姓名(多个以英文逗号分隔)", "默认人");
  if (viewers == null || viewers.trim() == "") {
    alert("请输入观演人姓名!");
    return getViewers();
  }
  return viewers;
}

/**
 * 统计字符串中某个子字符串出现的次数
 * @param {string} str - 目标字符串
 * @param {string} substr - 要查找的子字符串
 * @param {Object} [options] - 可选配置项
 * @param {boolean} [options.ignoreCase=false] - 是否忽略大小写
 * @param {boolean} [options.allowOverlap=false] - 是否允许重叠匹配
 * @returns {number} - 子字符串出现的次数
 */
function countSubstringOccurrences(str, substr, options = {}) {
  if (!str || !substr) return 0;

  let { ignoreCase = false, allowOverlap = false } = options;

  // 处理忽略大小写
  let sourceStr = ignoreCase ? str.toLowerCase() : str;
  let targetSubstr = ignoreCase ? substr.toLowerCase() : substr;

  // 处理空字符串
  if (targetSubstr === "") return 0;

  // 方法选择：根据是否允许重叠匹配，使用不同的实现
  if (allowOverlap) {
    // 允许重叠匹配的情况（如 "aaa" 中 "aa" 出现2次）
    let count = 0;
    let startIndex = 0;

    while (startIndex <= sourceStr.length - targetSubstr.length) {
      let foundIndex = sourceStr.indexOf(targetSubstr, startIndex);
      if (foundIndex === -1) break;

      count++;
      startIndex++; // 移动一位继续查找，允许重叠
    }

    return count;
  } else {
    // 不允许重叠匹配的情况（默认使用 split 方法）
    return sourceStr.split(targetSubstr).length - 1;
  }
}

function splitByTicketType(str) {
  let ticketTypes = ["看台", "内场"]; // 可根据实际情况扩展
  let regex = new RegExp(`(${ticketTypes.join("|")})`, "g");

  let tickets = [];
  let lastIndex = 0;

  // 查找所有关键词位置
  let match;
  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      // 提取上一个票信息（如果有）
      let ticket = str.slice(lastIndex, match.index).trim();
      if (ticket) tickets.push(ticket);
    }
    lastIndex = match.index;
  }

  // 添加最后一部分
  if (lastIndex < str.length) {
    tickets.push(str.slice(lastIndex).trim());
  }

  return tickets;
}

function getPoint({ index, bounds }) {
  let left = bounds.left;
  let top = bounds.top;
  let right = bounds.right;
  let bottom = bounds.bottom;
  let x = index === 0 ? left + 10 : right + 10;
  let y = (top + bottom) / 2;

  return { x, y };
}

// 快速获取当前页面orc 内容
function getScreenOrcInfo(wait) {
  let _wait = wait ? wait : 200;
  sleep(_wait); // 绝不能删除  不然orc需要一定时间 机型不同 时间会有所差异
  let img = images.captureScreen();
  let region = [0, 0.2, -1, 0.6];
  let currentScreenOcr = ocr(img, region);
  // console.log("ocr----", currentScreenOcr);
  img.recycle();
  return currentScreenOcr;
}

function unique(arr) {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    let isDuplicate = false;
    for (let j = 0; j < result.length; j++) {
      if (arr[i] === result[j]) {
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) {
      result.push(arr[i]);
    }
  }
  return result;
}
