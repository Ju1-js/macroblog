import { Route, BrowserRouter, Routes, Navigate } from 'react-router-dom';
import "./App.css";

import { BlueskyAuthProvider } from "./Auth/BlueskyAuthProvider";
import ProfileButton from "./Auth/ProfileButton";
import Navbar from "./customComponents/siteMenu";

import HomePage from "./Home";
import SearchPage from "./Search";
import BlogPage from './Blog';
import PostPage from './Post';

function App() {
  return(
    <div>
    <BrowserRouter>
      <BlueskyAuthProvider>
        <div className='fixed top-[3vh] right-[3vw]'>
          <ProfileButton></ProfileButton>
        </div>
        <div className='fixed top-[3vh] left-[3vw]'>
          <Navbar></Navbar>
        </div>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/blog/:handle" element={<BlogPage />} />
          <Route path="/blog/post/:uri" element={<PostPage />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </BlueskyAuthProvider>
    </BrowserRouter>
    </div>
  );
}

export default App;
