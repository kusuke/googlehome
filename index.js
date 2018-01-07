const firebase = require("firebase");
const BraviaRemoteControl = require("sony-bravia-tv-remote");
const fs = require('fs');

const configFile = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const braviaConfig = configFile.bravia;
const firebaseConfig = configFile.firebase;

const braviaRemote = new BraviaRemoteControl(braviaConfig.ip, braviaConfig.port, braviaConfig.key);

//RM-mini3
const broadlink = require("./getDevice")
const rmlist = require("./rmlist")

const braviaList = require("./bravialist")

//RM mini3 Device Set
const rmMac = configFile.rm.mac;
let rm = {}
const timer = setInterval(function() {
  rm = broadlink({host: rmMac})
  if (rm) {clearInterval(timer)}
}, 100)

//RM mini3 ir send
const rmSend = (command) => {
    const hexDataBuffer = new Buffer(rmlist[command], "hex")
    rm.sendData(hexDataBuffer)
}

// Bravia send
const braviaSend = (command) => {
	braviaRemote.sendAction(braviaList[command]);
  clearDb();
}

//firebase config
  var config = {
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    databaseURL: firebaseConfig.databaseURL,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId
  };

firebase.initializeApp(config);

//jsonからvalueに一致する値取得
const getJsonData = (value, json) => {
  for (var word in json)  if (value == word) return json[word]
  return json["default"]
}

//database更新時
const path = "/googlehome";
const key = "word";
const db = firebase.database();
db.ref(path).on("value", function(changedSnapshot) {
  //値取得
  const value = changedSnapshot.child(key).val();
  if (value) {

    //コマンド生成
    const command = getJsonData(value.split(" ")[0], {

      //シーリングライト
      "light": () => {
      	let index = 1;
      	const splitValue = value.split(" ")[index];
      	if (isSkipValue(splitValue)) index++;
        const command = getJsonData(value.split(" ")[index], {
          "つけ": "full",
          "オン": "full",
          "消し": "off",
          "けし": "off",
          "オフ": "off",
          "default": false
        });
        // return command ? () => rmSend(command) : command
        return command ? () => console.log("成功！"+command) : command
      },

      //bravia
      "bravia": () => {
      	let index = 1;
      	const splitValue = value.split(" ")[index];
      	if (isSkipValue(splitValue)) index++;
        const command = getJsonData(value.split(" ")[index], {
          "つけ": "on",
          "付け": "on",
          "オン": "on",
          "消し": "off",
          "けし": "off",
          "オフ": "off",
          "番組": "channellist",
          "音量": ()=>{
          	index++;
			      const nextSplitValue = value.split(" ")[index];
      		  if (isSkipValue(nextSplitValue)) index++;
          	return getJsonData(value.split(" ")[index], {
             "上げ": "volumeup",
             "下げ": "volumedown",
             "消し": "mute",
             "default": false
          	})
          },
          "チャンネル": ()=>{
          	index++;
			      const nextSplitValue = value.split(" ")[index];
      		  if (isSkipValue(nextSplitValue)) index++;
          	return getJsonData(value.split(" ")[index], {
             "変え": "channelup",
             "戻し": "channeldown",
             "NHK": "nhk",
             "フジ": "fuji",
             "あさ": "asahi",
             "朝": "asahi",
             "朝日": "asahi",
             "東京": "tokyo",
             "テレ": "tokyo",
             "テレビ東京": "tokyo",
             "日本": "nittere",
             "TBS": "tbs",
             "default": false
          	})
          },
          "default": false
        });
        if (typeof command === "string") {
        	return braviaSend(command);
        } else if (typeof command === "function") {
        	return braviaSend(command());
        }
      },

      "ps4": () => {
        const command = "sudo ps4-waker ";
        let index = 1;
        for(var i = index; isSkipValue(value.split(" ")[index]); i++){
          index++;
        }
        const option = getJsonData(value.split(" ")[index], {
          "起動": " ",
          "軌道": " ",
          "つけ": " ",
          "オン": " ",
          "スタンバイ": "standby",
          "消し": "standby",
          "けし": "standby",
          "止め": "standby",
          "とめ": "standby",
          "停止": "standby",
          "ホーム": "remote ps",
          "フォーム": "remote ps",
          "メニュー": "remote ps",
          "エンター": "remote enter",
          "センター": "remote enter",
          "選択": "remote enter",
          "バック": "remote back",
          "戻る": "remote back",
          "戻って": "remote back",
          "オプション": "remote options",
          "上": "remote up",
          "笛": "remote up",
          "うえ": "remote up",
          "下": "remote down",
          "した": "remote down",
          "左": "remote left",
          "右": "remote right",
          "地球": "start CUSA03653",
          "ちきゅう": "start CUSA03653",
          "default": false
        });
        return option ? command + option : option;
      },

      //default
      "default": () => false,

    })();

    //コマンド実行
    if (command) {
      //typeof
      if (typeof command === "string") {
        const exec = require('child_process').exec;
        exec(command);
      	console.log(command);
      } else if (typeof command === "function") {
        command()
      }
      
      clearDb();
    }
  }
});

const isSkipValue = (value)=> {
  return (value == "の" || value == "を" || value == "4" || value == "で");
}

//firebase clear
const clearDb = ()=> {
  db.ref(path).set({[key]: ""});
}