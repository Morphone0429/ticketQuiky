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
  maxTicketPrice: "700",
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

  // 1. 判断是否正常获取到节点
  // initChooseTicketRangeWeight({
  //   callback: watchTicketRange,
  // });
}

//
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
      const playEtcArr = user.playEtcStr.split(",");
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
  console.log(targetTickets);
  for (let amount of targetTickets) {
    doSubmit({ amount });
  }
}

function doSubmit({ amount }) {
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
  handleSureTicketInfoThenToPay();
}

// 确认购票信息并立即支付
function handleSureTicketInfoThenToPay() {}

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
  isDebug && log("符合条件:" + targetTickets);
  return targetTickets;
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
      layoutFinish: callback,
    });
  }
}

// 异常节点处理
function getNodeWithFallback({ layoutFinish }) {
  let orcResult = internalApiForPaddleOcr();
  let timeRangeArea = orcResult.filter((i) =>
    /周[一二三四五六日]/.test(i.label)
  ); // 场次
  let ticketRangeArea = orcResult.filter(
    (i) => i.label.includes("元") || i.label.includes(RMB)
  ); // 票档
  // 先处理场次
  handleSessionsChoose({
    timeRangeArea,
    callback: () => {
      // 再处理票档
      handleTicketRange({
        timeRangeArea,
        _ticketRangeArea: ticketRangeArea,
        callback: layoutFinish,
      });
    },
  });
}

// 处理场次
function handleSessionsChoose({ timeRangeArea, callback }) {
  if (timeRangeArea.length === 0) return;
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
    const cur = timeRangeArea[0];
    let point = getPoint({ index: 0, bounds: cur.bounds });
    click(point.x, point.y);
    callback();
  }
}

// 处理票档
// 当场次 length === 1 时 会默认选中该场次，所以会有票档的orc信息
// length> 1 时  选中场次之后才会有票档的orc信息
function handleTicketRange({ timeRangeArea, _ticketRangeArea, callback }) {
  let ticketRangeArea =
    timeRangeArea.length === 1
      ? _ticketRangeArea
      : internalApiForPaddleOcr().filter(
          (i) => i.label.includes("元") || i.label.includes(RMB)
        );
  if (ticketRangeArea.length === 0) {
    handleTicketRange({
      timeRangeArea,
      _ticketRangeArea: ticketRangeArea,
      callback,
    });
    return;
  }
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
  console.log(JSON.stringify(weights));
  let hasProd = weights.find((i) => i.hasProd); // 是否存在有货的票档
  if (hasProd) {
    // 存在，点击某一票档 进行缺货登记
    click(hasProd.point.x, hasProd.point.y);
    callback();
  } else {
    // 不存在，点击某一票档 进行缺货登记
    let firstNoProd = weights[0];
    click(firstNoProd.point.x, firstNoProd.point.y);
    className("android.widget.TextView").text("缺货登记").findOne().click();
    className("android.view.View").clickable(true).depth(9).findOne().click();
    callback();
  }
}

function screenIsLoadedWithOcr({ callBack, patchStep }) {
  console.log(isWeightFound("选择票档"), "选择票档");
  console.log(isWeightFound("确认购票"), "确认购买");
  console.log(isWeightFound("猫眼演出详情"), "猫眼演出详情");
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
  //   log(`识别结果: ${JSON.stringify(c)}`);
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
  const left = bounds.left;
  const top = bounds.top;
  const right = bounds.right;
  const bottom = bounds.bottom;
  let x = index === 0 ? left + 10 : right + 10;
  let y = (top + bottom) / 2;

  return { x, y };
}
