import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'

function App() {

  return (
    <>
      <div>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Smart City Hub</h1>
      <div className="card">
        <p>
        SmartCityHub is a project aiming to develop an integrated system for managing and monitoring urban infrastructure, leveraging technologies such as embedded modules, Node.js server, and mobile applications.
        </p>
      </div>
      <p className="read-the-docs">
        <a href='https://github.com/Kamilr616/smart_city_hub'>Github</a>
      </p>
    </>
  )
}

export default App
