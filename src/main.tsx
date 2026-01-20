import { createRoot } from "react-dom/client"
import App from "./App"
import "./index.css"

import Lenis from "@studio-freight/lenis"

const lenis = new Lenis({
  lerp: 0.08,              // smoothness (lower = smoother)
  wheelMultiplier: 1,      // scroll speed
  touchMultiplier: 1.2,    // mobile scroll
})

function raf(time: number) {
  lenis.raf(time)
  requestAnimationFrame(raf)
}

requestAnimationFrame(raf)

createRoot(document.getElementById("root")!).render(<App />)
