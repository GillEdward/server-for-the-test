var playerList = {}
var initPos = [0, 0]    // (x, y)

var express = require('express')    // 导入express模块
var app = express()    // 创建一个express实例
var server = require('ws').Server    // 创建一个websocket服务
var wss = new server({port:3000})
const io = require('nodejs-websocket')  // 导入nodejs-websocket模块

wss.on('connection', function connection(ws) {
    console.log('New Connection')

    ws.on("message", function(data){    // 处理客户端发送过来的消息
        json = JSON.parse(data)
        console.log("Message from " + json["player-id"] + "\nAction: " + json["action"] + "\nValue: " + json["value"]);

        switch(json["action"]){
            case "login":
                ws.send(JSON.stringify({"player-id" : "server", "action" : "loadIn", "value" : playerList})) // 向新玩家发送总表
                playerList[json["player-id"]] = JSON.parse(JSON.stringify(initPos)) // 添加新玩家信息到总表(深拷贝)
                wss.broadcast(JSON.stringify({"player-id" : json["player-id"], "action" : "newPlayerLogin", "value" : initPos}))    // 广播新玩家的ID和pos
                break
            case "logout":
                wss.broadcast(JSON.stringify({"player-id" : json["player-id"], "action" : "playerLogout"}))    // 广播登出玩家ID
                ws.send(JSON.stringify({"player-id" : "server", "action" : "logout"})) // 向登出玩家确认
                delete playerList[json["player-id"]]   // 从总表删除登出玩家
                break
            case "moving":
                if(json["value"] & 0b1000){ // Left
                    playerList[json["player-id"]][0] -= 1   // 修改服务器本地坐标
                }
                if(json["value"] & 0b0100){ // Up
                    playerList[json["player-id"]][1] += 1
                }
                if(json["value"] & 0b0010){ // Right
                    playerList[json["player-id"]][0] += 1
                }
                if(json["value"] & 0b0001){ // Down
                    playerList[json["player-id"]][1] -= 1
                }
                wss.broadcast(JSON.stringify(json))
                break
            case "movementDone":
                wss.broadcast(JSON.stringify({"player-id" : json["player-id"], "action" : "movementDone", "value" : playerList[json["player-id"]]}))    // 广播停止运动的玩家的标准坐标
                break
        }
    })
    
    ws.on("close", function(code, reason) {   // 监听关闭
        console.log("Disconnected")
    })
     
    ws.on("error", () => {   //监听异常
        console.log('Error')
    })
})

wss.broadcast = function broadcast(msg) {
    console.log("Broadcasting: " + msg)
    wss.clients.forEach(function each(client) {
        client.send(msg)
    })
}