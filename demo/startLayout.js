// var path = "/sdcard/脚本/有规格_寄到家_6个.js";
// if (!files.exists(path)) {
//     toast("脚本文件不存在: " + path);
//     exit();
// }

let pathConfig = {
    have_home: '/sdcard/脚本/有规格_寄到家_6个.js',
    have_market: '/sdcard/脚本/有规格_寄到家_6个.js',
    no_home: '/sdcard/脚本/有规格_寄到家_6个.js',
    no_market: '/sdcard/脚本/有规格_寄到家_6个.js',
    have_home_more: '/sdcard/脚本/有规格_寄到家_6个.js',
    have_market_more: '/sdcard/脚本/有规格_寄到家_6个.js',
    no_home_more: '/sdcard/脚本/有规格_寄到家_6个.js',
    no_market_more: '/sdcard/脚本/有规格_寄到家_6个.js',
}

let btnTextConfig = {
    have_home: '有_寄家',
    have_market: "有_到店",
    no_home: "无_寄家",
    no_market: "无_到店",
    have_home_more: "有_寄家2",
    have_market_more: "有_到店2",
    no_home_more: "无_寄家2",
    no_market_more: "无_到店2",
}

var window = floaty.window(
    <frame>
        <vertical>
            <horizontal>
                <button id="have_home" text="有_寄家" textSize="12dp" w="50" h="34" bg="#77ffffff" margin="2" />
                <button id="have_market" text="有_到店" textSize="12dp" w="50" h="34" bg="#77ffffff" margin="2" />
                <button id="no_home" text="无_寄家" textSize="12dp" w="50" h="34" bg="#65fdddff" margin="2" />
                <button id="no_market" text="无_到店" textSize="12dp" w="50" h="34" bg="#65fdddff" margin="2" />
            </horizontal>
            <horizontal>
                <button id="have_home_more" text="有_寄家2" textSize="12dp" w="50" h="34" bg="#77ffffff" margin="2" />
                <button id="have_market_more" text="有_到店2" textSize="12dp" w="50" h="34" bg="#77ffffff" margin="2" />
                <button id="no_home_more" text="无_寄家2" textSize="12dp" w="50" h="34" bg="#65fdddff" margin="2" />
                <button id="no_market_more" text="无_到店2" textSize="12dp" w="50" h="34" bg="#65fdddff" margin="2" />
            </horizontal>
        </vertical>
    </frame>
);
ui.run(function () {
    window.setPosition(70, 140);
});

window.exitOnClose();

var execution = null;
function handleBtnClick({ type }) {
    let targetText = btnTextConfig[type]
    let stopColor = "#FF0000"
    let originColor = type.includes('have') ? "#77ffffff" : '#65fdddff'
    let path = pathConfig[type]
    if (window[type].getText() === targetText) {
        let newColor = colors.parseColor(stopColor);
        if (!files.exists(path)) {
            toast("脚本文件不存在: " + path);
            exit();
        }
        execution = engines.execScriptFile(path);
        window[type].setText('停止');
        window[type].setBackgroundColor(newColor);
    } else {
        if (execution) {
            execution.getEngine().forceStop();
        }
        let newColor = colors.parseColor(originColor);
        window[type].setText(targetText);
        window[type].setBackgroundColor(newColor);
    }
}
window.have_home.click(() => {
    handleBtnClick({ type: 'have_home' })
});

window.have_market.click(() => {
    handleBtnClick({ type: 'have_market' })
});
window.no_home.click(() => {
    handleBtnClick({ type: 'no_home' })
});
window.no_market.click(() => {
    handleBtnClick({ type: 'no_market' })
});

// -----------more---------------
window.have_home_more.click(() => {
    handleBtnClick({ type: 'have_home_more' })
});
window.have_market_more.click(() => {
    handleBtnClick({ type: 'have_market_more' })
});
window.no_home_more.click(() => {
    handleBtnClick({ type: 'no_home_more' })
});
window.no_market_more.click(() => {
    handleBtnClick({ type: 'no_market_more' })
});

setInterval(() => { }, 1000);

