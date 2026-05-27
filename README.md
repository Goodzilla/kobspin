# 🎡 KobSpin

Custom wheels with option lives, shields, mystery shrouds, nested unlocks, and three layouts you can swap instantly. Yes, it's AI-assisted slop, but it actually works.

Most decision wheels give you a simple choice, spin once, and that's it. I wanted something more chaotic, so I built this. KobSpin lets you turn simple choices into a weird progressive game. You can give options lives so they don't disappear immediately, wrap them in glassy shields that crack, hide them under shrouds if you want a surprise, or chain them together so a backup option only appears when the main one runs out of lives.

👉 **Try it out:** [https://kobspin.org/](https://kobspin.org/)

---

## ☸️ Features

* **Three Layouts**: Swap views instantly! Choose the classic **Wheel Spinner**, a CS:GO-style scrolling **Lootbox Container**, or a high-stakes **Horse Race** where your choices sprint to cross the finish line.
* **Option Lives**: Give options a set number of lives (hearts). When an option is landed on, it loses a life. Or, make it **Unlimited** so it stays on the wheel forever.
* **Shields & Shrouds**: Wrap options in **Shields** (glass overlays that crack under repeated hits instead of losing lives) or **Shrouds** (mystery fog that hides the label until landed on).
* **Nested Unlock Chains**: Link options in custom chains. When a parent option runs out of lives and shatters, it automatically unlocks its sub-options on the wheel in real-time.
* **Local Persistence**: All your custom spinner configurations, segment weights, and remaining option lives save automatically in your browser's local storage (`localStorage`). No cloud database, no tracking, just pure local persistence.

---

## 🛠️ Local Setup

To run this project locally, make sure you have [Node.js](https://nodejs.org/) installed, then follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Goodzilla/kobspin.git
   cd kobspin
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open your browser and visit `http://localhost:5173/` (or the port shown in your terminal).

4. **Lint and format checks:**
   ```bash
   npm run lint
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```
   The compiled bundle will be outputted to the `dist/` directory.

---

## 🚀 Deployment

This project is configured and ready to be deployed on **Netlify** (with a `netlify.toml` file included in the root directory for proper routing and build headers).

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
