import React from "react";
import { Link } from "react-router-dom";
import "./navbar.css"; // CSS для стилізації

const Navbar = () => {
    return (
        <nav className="navbar">
            <ul>
                <li>
                    <Link to="/">Home</Link>
                </li>
                <li>
                    <Link to="/calendar">Calendar</Link>
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;
