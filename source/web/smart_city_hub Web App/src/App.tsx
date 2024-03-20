import './App.css'
import Home from './components/Home'
import React from "react";
import reactLogo from './assets/react.svg'
import gitLogo from './assets/github-mark-white.svg'
import kiLogo from './assets/ki_LOGO_w.svg'
import SensorCharts from "./components/SensorCharts.tsx";

function App() {

  return (
      <>
          <div className="title" onClick={() => window.location.reload()}>
              <h1>Smart City Hub</h1>
          </div>
          <div>
              <SensorCharts/>
          </div>
          <div>
              <Home/>
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
      </>
  )
}

export default App
