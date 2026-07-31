# 🩺 3D CBCT Volume Visualizer (NRRD)

![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![WebGL](https://img.shields.io/badge/WebGL-990000?style=for-the-badge&logo=webgl&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![Status](https://img.shields.io/badge/Status-Completed-success?style=for-the-badge)

A WebGL-based 3D medical volume visualizer built with **Three.js** for rendering `.nrrd` (Nearly Raw Raster Data) files directly in the browser. 

This project was developed as a core visual module for my **Thesis** and was specifically designed to be integrated into a larger medical imaging application pipeline.

---


---

## 🧩 Architectural Overview & Integration

* **Standalone Modular Design:** Engineered as an isolated, reusable frontend module dedicated strictly to 3D volume rendering, lighting, and camera controls.
* **Data Input & Static Paths:** In this repository's standalone version, the `.nrrd` file path is statically configured for local testing, benchmarking, and demonstration purposes.
* **Pipeline Integration:** Within the full thesis system, this module receives dynamic image paths and volume data directly from the backend API.

---

## ✨ Key Features

* **NRRD Parsing & Rendering:** Native decoding and rendering of complex 3D medical volumetric datasets.
* **Interactive Controls:** Smooth 360° orbit controls (rotation, zooming, and panning) for detailed anatomical inspection.
* **WebGL Optimization:** Efficient rendering pipeline tuned for browser performance.
* **Decoupled Architecture:** Clean separation between the rendering logic and data retrieval layer.

---

## 📂 Sample Medical Data (.nrrd)

Due to repository size constraints, heavy `.nrrd` sample files are **not stored directly** in this Git repository.

To run and test the visualizer locally:
1. Place your own `.nrrd` file inside the `assets/` (or project root) directory.
2. Ensure the relative path in the JavaScript code matches your file name.

---

## 🛠️ Getting Started

### Prerequisites
A modern web browser with WebGL support (Chrome, Firefox, Edge, Safari).
* **Node.js** (v16 or higher)
* **npm**

### Running Locally

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/mattia-gualtieri/ScanVision.git](https://github.com/mattia-gualtieri/ScanVision.git)
   cd ScanVision

2. **Start a local development server:**
(Required to prevent browser CORS policy errors when loading local .nrrd files)
