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
      	console.log(value)
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

      //default
      "default": () => false,

    })();

    //コマンド実行
    if (command) {
      //typeof
      if (typeof command === "string") {
      	console.log(command);
      } else if (typeof command === "function") {
        command()
      }

      //firebase clear
      db.ref(path).set({[key]: ""})
    }
  }
});

const isSkipValue = (value)=> {
  return (value == "の" || value == "を");
}