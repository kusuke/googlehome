import { configFile, clearSpecificWordDb } from './index.js';
import { getJsonData } from './utils.js';
import braviaList from './bravialist';
import rmList from './rmlist';
import BraviaRemoteControl from 'sony-bravia-tv-remote';

export function braviaCommand(value) {
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
}

export function ps4Command(value) {
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
}

export function lightCommand(value, rm) {
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
    "さわ": "switchA",
    "さわやか": "switchA",
    "爽やか": "switchA",
    "図書": "switchB",
    "図書館": "switchB",
    "としょ": "switchB",
    "としょかん": "switchB",
    "だん": "switchC",
    "団欒": "switchC",
    "だんらん": "switchC",
    "だんだん": "switchC",
    "ダウンロード": "switchC",
    "くつ": "switchD",
    "くつろぎ": "switchD",
    "寛ぎ": "switchD",
    "default": false
  });
  return command ? () => rmSend(rm, rmList.light[command]) : command;
}

export function airConCommand(value, rm) {
  let index = 1;
  const splitValue = value.split(" ")[index];
  if (isSkipValue(splitValue)) index++;
  const command = getJsonData(value.split(" ")[index], {
    "消し": "off",
    "けし": "off",
    "オフ": "off",
    "節電": "powerSave",
    "せつ": "powerSave",
    "せつでん": "powerSave",
    "だん": "heat",
    "だんぼう": "heat",
    "暖房": "heat",
    "れい": "cool",
    "れいぼう": "cool",
    "冷房": "cool",
    "温度": ()=>{
      index++;
      const nextSplitValue = value.split(" ")[index];
      if (isSkipValue(nextSplitValue)) index++;
      return getJsonData(value.split(" ")[index], {
       "上げ": "up",
       "下げ": "down",
       "default": false
      })
    },
    "default": false
  });
  return command ? () => rmSend(rm, rmList.light[command]) : command;
}

function rmSend(rm, command) {
  const hexDataBuffer = new Buffer(command, "hex")
  rm.sendData(hexDataBuffer)
}

function braviaSend(command) {
  const braviaConfig = configFile.bravia;
  const braviaRemote = new BraviaRemoteControl(braviaConfig.ip, braviaConfig.port, braviaConfig.key);

  braviaRemote.sendAction(braviaList[command]);
  clearSpecificWordDb();
}

const isSkipValue = (value)=> {
  return (value == "の" || value == "を" || value == "4" || value == "で");
}
