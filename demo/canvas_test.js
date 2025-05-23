const canvas = new Canvas(device.width, device.height);
const paint = new Paint();

// 绘制红色矩形
paint.setColor(colors.RED);
canvas.drawRect(50, 50, 100, 100, paint);

// ❌ 不再需要 `canvas.flush();`
// ✅ 直接绘制即可显示
