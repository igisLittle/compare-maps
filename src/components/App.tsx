import React from "react";
import logo from "../images/logo.svg";
import WebMapView from "./WebMapView/WebMapView";
import MapBoxView from "./MapBoxView/MapBoxView";
import "../styles/App.css";

function App(): JSX.Element {
  return (
    <div className="App">
      <div className="App-view">
        <WebMapView />
        <MapBoxView />
      </div>
    </div>
  );
}

export default App;
