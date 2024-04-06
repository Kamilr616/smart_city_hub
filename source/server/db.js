//var admin = require("firebase-admin");
//var serviceAccount = require("./keys/smart-city-hub-at-firebase-adminsdk-ew4lh-4b2937eb90.json");
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore/lite');

const firebaseConfig = {
    apiKey: "AIzaSyCR4n1ntX1TFztM7xxh2ZS7CCvuTs0OnKg",
    authDomain: "smart-city-hub-at.firebaseapp.com",
    projectId: "smart-city-hub-at",
    storageBucket: "smart-city-hub-at.appspot.com",
    messagingSenderId: "316368168396",
    appId: "1:316368168396:web:aa0defa6dd2842caf06969",
    measurementId: "G-VZYTT73VWL"
};

const fb = initializeApp(firebaseConfig);
const db = getFirestore(fb)

module.exports = db;