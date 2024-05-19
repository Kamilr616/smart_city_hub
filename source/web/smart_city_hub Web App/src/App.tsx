import './App.css'
import Home from './components/Home'
import React from "react";
import reactLogo from './assets/react.svg'
import gitLogo from './assets/github-mark-white.svg'
import kiLogo from './assets/ki_LOGO_w.svg'
import SensorCharts from "./components/SensorCharts.tsx";
import Charts from "./components/charts.tsx";
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import DeviceNames from "./components/DeviceNames.tsx";

function App() {

  return (
      <>
          <div className="title" onClick={() => window.location.reload()}>
              <h1>Smart City Hub</h1>
          </div>
          <div className='card'>
              <a href="https://react.dev" target="_blank">
                  <img src={reactLogo} className="logo react" alt="React logo"/>
              </a>
              <a href="https://github.com/Kamilr616/smart_city_hub" target="_blank">
                  <img src={gitLogo} className="logo react" alt="Git logo"/>
              </a>
              <a href="https://anstar.edu.pl/" target="_blank">
                  <img src={kiLogo} className="logo react" alt="Git logo"/>
              </a>
          </div>
          <div className="read-the-docs">
              <p>
                  SmartCityHub is a project aiming to develop an integrated system for managing and monitoring urban
                  infrastructure, leveraging technologies such as embedded modules, Node.js server, and mobile
                  applications.
              </p>
          </div>
              <Router>
      <nav style={{ margin: 12 }}>
        <Link to="/" style={{ padding: 5 }}>
          Home
        </Link>
        <Link to="/devices" style={{ padding: 5 }}>
          Devices
        </Link>
        <Link to="/charts" style={{ padding: 5 }}>
          Charts
        </Link>
      </nav>
                  <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/charts" element={<Charts />} />
        <Route path="/devices" element={<Home />} />
      </Routes>
    </ Router>
      </>

  )
}

export default App
