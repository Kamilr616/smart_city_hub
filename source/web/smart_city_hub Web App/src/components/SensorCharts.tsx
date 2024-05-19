import React from "react"
import TempChart from "./TempChart"
import HumChart from "./HumChart"

const Home: React.FC = () => {

  return (
      <>
          <div className='card'>
              <HumChart EUID="2CF7F1C0443002D2" DName="Weather Station"/>
              <TempChart EUID="2CF7F1C0443002D2" DName="Weather Station"/>
          </div>
          <div className='card'>
              <TempChart EUID="2CF7F1C054100647" DName="Tracker"/>
          </div>

      </>
  )
}

export default Home
