import { Route, Routes } from "react-router-dom";
import MainHeader from "./components/MainHeader";
import Home from "./components/Home";
import PageNotFound from "./components/PageNotFound";
import Core from "./components/Core";
import Dsa from "./components/Dsa";
import Dev from "./components/Dev";
import Discussion from "./components/Discussion";
import About from "./components/About";
import Login from "./components/Login";
import Signup from "./components/Signup";
import axios from "axios";
import { loginSuccess } from "./store/authSlice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "./store/storeSetup";
import CreateAccount from "./components/CreateAccount";

const App = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/v1/relaod", {withCredentials: true});
        dispatch(loginSuccess(res.data.user));
      } catch(err) {
        console.log("Not logged in");
      }
    }
    fetchUser();
  }, []);

  return (
    <div>
        <Routes>
          <Route path="/" element={<MainHeader/>}>
            <Route index element={<Home/>} />
            <Route path="core" element={<Core/>}/>
            <Route path="dsa" element={<Dsa/>}/>
            <Route path="dev" element={<Dev/>}/>
            <Route path="discussion" element={<Discussion/>}/>
            <Route path="about" element={<About/>}/>
            <Route path="login" element={<Login/>}/>
            <Route path="signup" element={<Signup/>}/>
            <Route path="create-account" element={<CreateAccount/>}/>
          </Route>
          <Route path="*" element={<PageNotFound/>}/>
        </Routes>
    </div>
  );
}

export default App;