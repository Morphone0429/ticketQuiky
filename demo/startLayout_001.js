var path = "/sdcard/脚本/有规格_寄到家_6个.js";
if (!files.exists(path)) {
    toast("脚本文件不存在: " + path);
    exit();
}

var window = floaty.window(
    <frame>
        <vertical>
            <horizontal>
                <button id="have_home" text="有_寄家" textSize="12dp" w="50" h="34" bg="#77ffffff" margin="2" />

            </horizontal>

        </vertical>
    </frame>
);
ui.run(function () {
    window.setPosition(70, 140);
});

// window.exitOnClose();

var execution = null;

// window.have_home.click(() => {
//     ui.run(() => {
//         if (window.have_home.getText() === '有_寄家') {
//             execution = engines.execScriptFile(path);
//             window.have_home.setText('停止');
//         } else {
//             // ✅ 确保 execution 存在才停止
//             if (execution && execution.getEngine()) {
//                 try {
//                     execution.getEngine().forceStop();
//                 } catch (e) {
//                     toastLog("停止失败：" + e);
//                 }
//             }
//             window.have_home.setText('有_寄家');
//         }
//     });
// });

window.have_home.click(() => {
    ui.run(() => {
        if (window.have_home.getText() === '有_寄家') {
            window.have_home.setText('停止');
            let newColor = colors.parseColor("#FF0000");
            window.have_home.setBackgroundColor(newColor);
        } else {
            window.have_home.setText('有_寄家');
            window.have_home.setBackgroundColor("#77FFFFFF");
        }
    });
});






setInterval(() => { }, 1000);

