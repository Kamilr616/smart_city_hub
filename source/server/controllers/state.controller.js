var express = require('express');
var Router = express.Router;
const db = require('../db');
const { collection, getDocs } = require('firebase/firestore/lite');

class StateController {
  constructor() {
    this.router = Router();
    this.getLocations = this.getLocations.bind(this);
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get('/locations', this.getLocations);
    this.router.get('/outlets', this.getOutlets);

  }
  async getOutlets(req, res) {
    const collectionRef = collection(db, 'outlets');
    const documentSnapshot = await getDocs(collectionRef);
    res.json(documentSnapshot.docs.map(doc => doc.data()));
  }

  async getLocations(req, res) {
    const collectionRef = collection(db, 'locations');
    const documentSnapshot = await getDocs(collectionRef);
    res.json(documentSnapshot.docs.map(doc => doc.data()));
  }
}

module.exports = StateController;