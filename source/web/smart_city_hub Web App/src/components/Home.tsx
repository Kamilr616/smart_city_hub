import React from "react"
import DeviceNames from "./DeviceNames"

const Home: React.FC = () => {

  return (
      <>
          <div className='card'>
              <DeviceNames channelNumber={2475480} apiKey="8O9SUY1PLXJ8UP4R"/>
          </div>
          <div className='card'>
              <DeviceNames channelNumber={2477248} apiKey="T0105VZ9G2GH2AVB"/>
          </div>

      </>
  )
}

export default Home
