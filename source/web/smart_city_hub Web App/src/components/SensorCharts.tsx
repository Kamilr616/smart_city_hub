import React from "react"
import TempChart from "./TempChart"
import HumChart from "./HumChart"

const Home: React.FC = () => {

  return (
      <>
          <div className='card'>
              <h2>Weather Station</h2>
              <HumChart EUID="2CF7F1C0443002D2"/>
              <TempChart EUID="2CF7F1C0443002D2"/>
          </div>
          <div className='card'>
              <h2>Tracker</h2>
              <TempChart EUID="2CF7F1C054100647"/>
          </div>

      </>
  )
}

export default Home
