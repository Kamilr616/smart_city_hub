import React from "react"
import DeviceNames from "./DeviceNames"

const Home: React.FC = () => {

  return (
      <>
          <div className='card'>
              <DeviceNames channelNumber={2475480} apiKey="REDACTED"/>
          </div>
          <div className='card'>
              <DeviceNames channelNumber={2477248} apiKey="T0105VZ9G2GH2AVB"/>
          </div>

      </>
  )
}

export default Home
