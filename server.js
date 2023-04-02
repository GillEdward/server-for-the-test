var playerList = {}
var initPos = [0, 0]    // (x, y)

var express = require('express')    // 导入express模块
var app = express()    // 创建一个express实例
var server = require('ws').Server    // 创建一个websocket服务
var wss = new server({port:3000})
const io = require('nodejs-websocket')  // 导入nodejs-websocket模块

console.log("Server started")

// Use client's pos, well, unable to check bordar for sure from server then
/*
setInterval(function(){ //更新玩家位置坐标  // update players' pos
    for(var key in playerList){
        switch(playerList[key]["action"]){  // 改变移动中玩家的坐标   // change moving player's pos
            case "movingLeft":
                playerList[key]["pos"][0] -= 1
                break
            case "movingUp":
                playerList[key]["pos"][1] += 1
                break
            case "movingRight":
                playerList[key]["pos"][0] += 1
                break
            case "movingDown":
                playerList[key]["pos"][1] -= 1
                break
        }
    }
}, 20);  // 50Hz
*/

wss.on('connection', function connection(ws) {
    console.log('New Connection')

    ws.on("message", function(data){    // 处理客户端发送过来的消息 // on message
        json = JSON.parse(data)
        console.log("Message from " + json["player-id"] + "\nAction: " + json["action"] + "\nValue: " + json["value"]);

        switch(json["action"]){
            case "login":
                ws.send(JSON.stringify({"player-id" : "server", "action" : "loadIn", "value" : playerList})) // 向新玩家发送总表    // send new player the playerList that contant all the ID and pos of players
                playerList[json["player-id"]] = {"action" : "standing", "pos" : JSON.parse(JSON.stringify(initPos)), "color" : json["color"]} // 添加新玩家信息到总表(深拷贝)
                wss.broadcast(JSON.stringify({"player-id" : json["player-id"], "action" : "newPlayerLogin", "value" : playerList[json["player-id"]]}))    // 广播新玩家的ID和pos // broadcast new player's ID and pos
                break
            case "logout":
                wss.broadcast(JSON.stringify({"player-id" : json["player-id"], "action" : "playerLogout"}))    // 广播登出玩家ID  // broadcast the logout player's ID
                ws.send(JSON.stringify({"player-id" : "server", "action" : "logout"})) // 向登出玩家确认   // comfrim to logout player
                delete playerList[json["player-id"]]   // 从总表删除登出玩家 // delete the player from playerList
                break
            case "moving":
                if(json["value"] & 0b1000){ // Left
                    playerList[json["player-id"]]["action"] = "movingLeft"   // 修改player动作信息    // change player's action
                    wss.broadcast(JSON.stringify({"player-id" : json["player-id"], "action" : "moving", "value" : "Left"}))
                }
                if(json["value"] & 0b0100){ // Up
                    playerList[json["player-id"]]["action"] = "movingUp"
                    wss.broadcast(JSON.stringify({"player-id" : json["player-id"], "action" : "moving", "value" : "Up"}))
                }
                if(json["value"] & 0b0010){ // Right
                    playerList[json["player-id"]]["action"] = "movingRight"
                    wss.broadcast(JSON.stringify({"player-id" : json["player-id"], "action" : "moving", "value" : "Right"}))
                }
                if(json["value"] & 0b0001){ // Down
                    playerList[json["player-id"]]["action"] = "movingDown"
                    wss.broadcast(JSON.stringify({"player-id" : json["player-id"], "action" : "moving", "value" : "Down"}))
                }
                break
            case "movementDone":
                playerList[json["player-id"]]["action"] = "standing"
                playerList[json["player-id"]]["pos"] = json["value"]
                wss.broadcast(JSON.stringify({"player-id" : json["player-id"], "action" : "movementDone", "value" : json["value"]}))    // 广播停止运动的玩家的标准坐标   // broadcast the player that stop moving, sycn every player's playerList
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

wss.broadcast = function broadcast(msg) {   // broadcast to all players
    console.log("Broadcasting: " + msg)
    wss.clients.forEach(function each(client) {
        client.send(msg)
    })
}