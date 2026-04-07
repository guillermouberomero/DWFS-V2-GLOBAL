import React from "react";
import MainContent from "./MainContent/MainContent.jsx";
import Footer from "./Footer/Footer.jsx";
import Menu from "./Menu/Menu.jsx";

export default function App() {

    console.log('[App] render');

    return (
        <div className="app-layout">

            <Menu/>
            {/* <MenuProps backgroundColor="red"/> */}
            {/* <MenuPropsDestructuring backgroundColor="red"/> */}

            <MainContent/>
            {/* <MainContentFragmentExplicito/> */}
            {/* <MainContentFragmentImplicito/> */}

            <Footer/>
        </div>
    );
}