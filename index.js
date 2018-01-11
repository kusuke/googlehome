import { braviaCommand, ps4Command, lightCommand, airConCommand, muscleTrainingNormaAction, muscleTrainingAction } from './command.js';
import { getJsonData } from './utils.js';
import firebase from 'firebase';
import googlehome from 'google-home-notifier';
import fs from 'fs';
// import broadlink from './getDevice';
import rmlist from './rmlist';

export const configFile = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

// let rm = {}
// const timer = setInterval(function() {
//   rm = broadlink({host: configFile.rm.mac})
//   if (rm) {
//     clearInterval(timer)
//   }
// }, 100)

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

    // "light": ()=>{
    //   return lightCommand(specificWord, rm);
    // },
    "bravia": ()=>{
      return braviaCommand(specificWord);
    },
    "ps4": ()=>{
      return ps4Command(specificWord);
    },
    // "airConditioning": ()=>{
    //   return airConCommand(specificWord, rm);
    // },
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

  const allNorma = changedSnapshot.child('allNorma').val();
  const dayNorma = changedSnapshot.child('dayNorma').val();

  const command = getJsonData(specificWord.split(" ")[0], {
    "muscleTrainingNorma": ()=> {
      return muscleTrainingNormaAction(allNorma, dayNorma, googlehome);
    },
    "muscleTraining": ()=>{
      return muscleTrainingAction(specificWord);
    },
    "default": () => false,
  })();

  if (command && typeof command === "string") {
    const exec = require('child_process').exec;
    exec(command);
  } else if (command && typeof command === "function") {
    command();
  }

  firebaseDB.ref(`${rootPath}${muscleTrainingPath}`).update({"word": ""});
});

//firebase clear
export const clearSpecificWordDb = ()=> {
  firebaseDB.ref(`${rootPath}${electronicsPath}`).set({[specificWordPath]: ""});
}
