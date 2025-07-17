import { Outlet } from "react-router-dom"
import NavBar from "./NavBar";
import React from "react";

const MainHeader: React.FC = ()=> {
    return (
        <div>
            <NavBar/>
            <Outlet/>
        </div>
    )
}

export default MainHeader;