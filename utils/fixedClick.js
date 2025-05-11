auto.waitFor();

const config = {
  point: { x: 628, y: 2249 },
  count: 0,
  sleepTime: 20,
};

main();

function main() {
  let point = config.point;
  if (!config.point) {
    const _p = getPointByInput().split(",");
    if (_p.length !== 2) {
      getPointByInput();
      return;
    }
    point = {
      x: _p[0],
      y: p[1],
    };
  }
  while (true) {
    click(point.x, point.y);
    config.count++;
    sleep(config.sleepTime);
  }
}

function getPointByInput() {
  let point = rawInput("请输入x,y坐标 如200，300");
  if (point == null || point.trim() == "") {
    alert("请输入x,y坐标!");
    return getPointByInput();
  }
  return point;
}
