import { NavLink } from "react-router-dom";
import type { RootState } from "../store/storeSetup";
import { logout } from "../store/authSlice";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import React from "react";

const NavBar: React.FC = () => {
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const dispatch = useDispatch();

    const handleLogout = () => {
        dispatch(logout());
    }
    return (
        <nav>
            <div>
                <NavLink to="/">VSen</NavLink>
                <NavLink to="core">Core</NavLink>
                <NavLink to="dsa">DSA</NavLink>
                <NavLink to="dev">DEV</NavLink>
                <NavLink to="discussion">Discussion</NavLink>
                <NavLink to="about">About</NavLink>
            </div>
            <div>
                {
                    !isAuthenticated 
                    ? (
                        <div>
                            <NavLink to="login">Login</NavLink> 
                            <NavLink to="singup">Sign Up</NavLink>  
                        </div>
                    )
                    : (
                        <button onClick={handleLogout}>Logout</button>
                    )
                }

            </div>
        </nav>
    );
}

export default NavBar;