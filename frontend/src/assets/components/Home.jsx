import React from 'react'
import logo from "../images/logo.png";
import header from "../images/headertext.png";

function Home () {
  return (
    <div>
        <header>
        <div class="logo">
            <img class="logo-image" src={logo} alt="TideShare Logo"></img>
        </div>
    </header>
    
    <main>
        <section class="message">
            <img class="message-image" src={header} alt=""></img>
            
        </section>
    </main>
    </div>
  )
}

export default Home;