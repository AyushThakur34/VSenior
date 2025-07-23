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
import { loginSuccess, logout } from "./store/authSlice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "./store/storeSetup";
import { api } from "./utils/api";
import CreateAccount from "./components/CreateAccount";
import VerifyEmail from "./components/VerifyEmail";

const App = () => {
  const dispatch = useDispatch<AppDispatch>();

  const url = process.env.BASE_URL;
  useEffect(() => { // handle page reload
    let isMounted = true;
    const fetchUser = async () => {
      try {
        const res = await api.get("/reload");
        const { user } = res.data;
        if(isMounted) dispatch(loginSuccess(user));
        return ;
      } catch(err) {
        console.log("Access Token Missing");
      }

      try {
        const res = await api.get("/refresh-token");
        const { user } = res.data;
        if(isMounted) dispatch(loginSuccess(user));
        return ;
      } catch(err) {
        console.log("Refresh Token Missing");
      }

      try {
        if(isMounted) dispatch(logout());
        await api.post("/logout")
      } catch(err) {
        console.log("Somthing Went Wrong")
      }
    }

    fetchUser();
    return () => {
      isMounted = false;
    }
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
            <Route path="singup" element={<Signup/>}/>
            <Route path="create-account" element={<CreateAccount/>}/>
            <Route path="verify-email" element={<VerifyEmail/>}/>
          </Route>
          <Route path="*" element={<PageNotFound/>}/>
        </Routes>
    </div>
  );
}

export default App;