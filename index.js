import { braviaCommand, ps4Command, lightCommand, airConCommand, muscleTrainingNormaAction, muscleTrainingAction, muscleTrainingTimerAction } from './command.js';
import { getJsonData } from './utils.js';
import firebase from 'firebase';
import googlehome from 'google-home-notifier';
import fs from 'fs';

export const configFile = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

//firebase config
const firebaseConfig = {
  apiKey: configFile.firebase.apiKey,
  authDomain: configFile.firebase.authDomain,
  databaseURL: configFile.firebase.databaseURL,
  projectId: configFile.firebase.projectId,
  storageBucket: configFile.firebase.storageBucket,
  messagingSenderId: configFile.firebase.messagingSenderId
};

firebase.initializeApp(firebaseConfig);

// googlehome setting
googlehome.device('Google-Home', 'ja');

const rootPath = "/googlehome/body";
const electronicsPath = "/electronics";
const specificWordPath = "word";
const muscleTrainingPath = "/muscleTraining";
const firebaseDB = firebase.database();

firebaseDB.ref(`${rootPath}${electronicsPath}`).on("value", function(changedSnapshot) {
  const specificWord = changedSnapshot.child(specificWordPath).val();

  if (!specificWord) {
    return;
  }

  const command = getJsonData(specificWord.split(" ")[0], {

    "bravia": ()=>{
      return braviaCommand(specificWord);
    },
    "ps4": ()=>{
      return ps4Command(specificWord);
    },
    "default": () => false,
  })();

  if (command && typeof command === "string") {
    const exec = require('child_process').exec;
    exec(command);
  } else if (command && typeof command === "function") {
    command()
  }
  clearSpecificWordDb();
});

firebaseDB.ref(`${rootPath}${muscleTrainingPath}`).on("value", function(changedSnapshot) {
  const specificWord = changedSnapshot.child(specificWordPath).val();

  const allNorma = Number(changedSnapshot.child('allNorma').val());
  const dayNorma = Number(changedSnapshot.child('dayNorma').val());
  const count = Number(specificWord.split(" ")[1]);
  const timer = changedSnapshot.child('timer').val();

  const command = getJsonData(specificWord.split(" ")[0], {
    "muscleTrainingNorma": ()=> {
      return muscleTrainingNormaAction(allNorma, dayNorma, googlehome);
    },
    "muscleTrainingCount": ()=>{
      const newAllNorma = allNorma - count;
      const newDayNorma = dayNorma - count;
      
      firebaseDB.ref(`${rootPath}${muscleTrainingPath}`).update({
        "allNorma": newAllNorma,
        "dayNorma": newDayNorma,
        "count": "",
        "word": ""
      });
      return muscleTrainingAction(newDayNorma, googlehome);
    },
    "default": () => {
      if(timer != "true"){
        return false;
      }
      const newAllNorma = allNorma + 3;
      const newDayNorma = dayNorma + 3;
      firebaseDB.ref(`${rootPath}${muscleTrainingPath}`).update({
        "allNorma": newAllNorma,
        "dayNorma": newDayNorma,
        "timer": "false"
      });
      return muscleTrainingTimerAction(googlehome, timer, dayNorma);
    },
  })();

  if (command && typeof command === "string") {
    const exec = require('child_process').exec;
    exec(command);
  } else if (command && typeof command === "function") {
    command();
  }
});

//firebase clear
export const clearSpecificWordDb = ()=> {
  firebaseDB.ref(`${rootPath}${electronicsPath}`).set({[specificWordPath]: ""});
}
