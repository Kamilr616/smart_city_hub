var express = require('express');
var Router = express.Router;

class StateController {
  constructor() {
    this.path = '/api/state';
    this.router = Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get(this.path, this.getState);
  }

  getState(req, res) {
    try {
      const posts = [
        { id: 1, title: 'Post 1', content: 'Treść posta 1' },
        { id: 2, title: 'Post 2', content: 'Treść posta 2' },
      ];
      res.json(posts);
    } catch (error) {
      console.error('Błąd podczas pobierania postów:', error);
      res.status(500).json({ error: 'Wystąpił błąd podczas pobierania postów' });
    }
  }
}

module.exports = StateController;
