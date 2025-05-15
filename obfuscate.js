/**
 * 调用JShaman.com WebAPI接口 实现对目录中的所有JS文件一次性完成混淆加密，包括子目录
 */

/**
 * 配置部分
 */
//JShaman.com VIP码，免费使用设为"free"，如已购买VIP码，在此修改
const vip_code = "free";

//对JS文件混淆加密后，是覆盖原文件，true为是，false为否，否的话会创建文件副本，后缀名为:.obfuscated.js
const overwrite_after_obfuscate = false;

//混淆加密参数配置，免费使用时无需配置
//参数详细说明请参见JShaman官网，设为"true"启用功能、设为"false"不启用
const config = {
    //压缩代码
    compact: "true",
    //混淆全局变量名和函数名
    renameGlobalFunctionVariable: "true",
    //平展控制流
    controlFlowFlattening: "false",
    //僵尸代码植入
    deadCodeInjection: "false",
    //字符串阵列化
    stringArray: "false",
    //阵列字符串加密
    stringArrayEncoding: "false",
    //禁用命令行输出 
    disableConsoleOutput: "false",
    //反浏览器调试
    debugProtection: "false",
    //时间限定
    time_range: "false",
    //时间限定起始时间、结束时间，时间限定启用时此2参数生效
    time_start: "20240118",
    time_end: "20240118",
    //域名锁定
    domainLock: [],
    //保留关键字
    reservedNames: [],
}

/**
 * 以下代码实现向JShaman.com WebApi发送请求完成JavaScript混淆加密，无需修改
 */
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const request = require('sync-request');

// 要处理的文件夹白名单
// const targetFolders = ['honor70', 'mi8', 'nova5pro', 'vivoy77e'];
const targetFolders = ['vivoy77e'];

// 排除的文件夹
const excludedFolders = ['node_modules', 'package'];

//对目录下的所有JS文件进行混淆加密，包括子目录
function obfuscate(folder) {
    //同步读取路径
    var files = fs.readdirSync(folder);
    //遍历指定目录下各文件或目录
    for (var i = 0; i < files.length; i++) {
        //文件
        var file = path.join(folder, files[i]);
        //同步获取文件信息
        var file_info = fs.statSync(file)
        //如果是目录
        if (file_info.isDirectory()) {
            // 排除不需要的目录
            const shouldExclude = excludedFolders.some(excluded =>
                file.includes(excluded)
            );
            if (!shouldExclude) {
                //嵌套调用，继续遍历
                obfuscate(file);
            }
        } else {
            //获取文件后缀
            var ext = path.extname(file).toLowerCase();
            //只处理JS文件
            if (ext == ".js") {

                console.log(`正在混淆加密文件：${file}`);

                //从文件中获取JavaScript代码
                var javascript_code = fs.readFileSync(file, "utf8").toString();

                //使用free为VIP码、免费调用JShaman WebAPI接口时，不能配置参数，仅可实现较低强度代码保护
                //如果购买了JShaman的VIP码，则可启用配置，实现高强度JavaScript混淆加密
                var json_options = {
                    json: {
                        //JavaScript代码
                        "js_code": javascript_code,
                        //JShaman VIP码
                        "vip_code": vip_code,
                    }
                }
                if (vip_code != "free") {
                    //混淆加密参数
                    json_options.json.config = config;
                    console.log(config);
                }

                console.log("正在向JShaman.com提交混淆加密请求...")
                //发送请求到JShaman服务器，进行JavaScript混淆加密
                var res = request("POST", "https://www.jshaman.com:4430/submit_js_code/", json_options);
                var json_res = JSON.parse(res.getBody('utf8'));

                //返回状态值为0是成功标识
                if (json_res.status == 0) {

                    //输出返回消息
                    console.log(json_res.message);

                    if (overwrite_after_obfuscate == true) {
                        //输入y，覆盖原文件  
                        fs.writeFileSync(file, json_res.content.toString());
                        console.log("文件已覆盖：", file,);
                    } else {
                        var obfuscated_file = path.join(path.dirname(file), path.basename(file) + ".obfuscated.js");
                        fs.writeFileSync(obfuscated_file, json_res.content.toString());
                        console.log("已保存文件副本：", obfuscated_file);
                    }
                } else {
                    console.error("向JShaman.com发送请求时出现错误：", json_res);
                }

                //暂停2秒
                busy_sleep(2000);
            }
        }
    }
}
// 处理所有目标文件夹
targetFolders.forEach(folder => {
    if (fs.existsSync(folder)) {
        console.log(`正在处理文件夹: ${folder}`);
        obfuscate(folder);
    } else {
        console.log(`文件夹 ${folder} 不存在，跳过`);
    }
});
pause();

//按任意键继续
function pause(message, callback) {
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question(message || '按任意键继续...', function () {
        rl.close();
    });
}

//暂停等待
function busy_sleep(milliseconds) {
    var start = Date.now();
    while ((Date.now() - start) < milliseconds) { }
    // 没有实际操作，仅让CPU空转以消耗时间
}
