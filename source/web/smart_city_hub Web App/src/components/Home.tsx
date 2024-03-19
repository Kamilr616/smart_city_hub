import React from "react"
import DeviceNames from "./DeviceNames"

const Home: React.FC = () => {

  return (
      <>
          <h1>Smart City Hub</h1>
          <div className="card">
              <p>
                  SmartCityHub is a project aiming to develop an integrated system for managing and monitoring urban
                  infrastructure, leveraging technologies such as embedded modules, Node.js server, and mobile
                  applications.
              </p>
          </div>
          <div className='card'>
              <DeviceNames channelNumber={2475480} apiKey="8O9SUY1PLXJ8UP4R"/>
              </div>
          <div className='card'>
              <DeviceNames channelNumber={2477248} apiKey="T0105VZ9G2GH2AVB"/>
          </div>
          <p className="read-the-docs">
              <a href='https://github.com/Kamilr616/smart_city_hub'>Github</a>
          </p>
      </>
  )
}

export default Home
