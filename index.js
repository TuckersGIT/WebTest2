import * as THREE from "three";
import {GLTFLoader} from "jsm/loaders/GLTFLoader.js";
let mesh;

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10);
camera.position.z = 3;

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x404040);

// Mesh
const gltfLoader = new GLTFLoader();
gltfLoader.load('./assets/lowpolypatrick.glb', (gltf) => {
  mesh = gltf.scene;
  mesh.traverse((child) => {
    if (child.isMesh) {
      child.geometry.center();

      const hullGeo = child.geometry.clone();
      hullGeo.scale(1.02, 1.02, 1.02);
      const hullMath = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });
      const hullMesh = new THREE.Mesh(hullGeo, hullMath);
      hullMesh.geometry.center();
      
      mesh.add(hullMesh);
    }
});
  mesh.scale.set(2, 2, 2);
  scene.add(mesh);
});


// Light
const hemilight = new THREE.HemisphereLight(0xffffff, 0x000000, 1);
scene.add(hemilight);

// Rotation variables
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let rotationVelocity = { x: 0, y: 0 };
const dampingFactor = 0.95;

// --- Mouse Events ---
renderer.domElement.addEventListener("mousedown", () => {
  isDragging = true;
});

renderer.domElement.addEventListener("mouseup", () => {
  isDragging = false;
});

renderer.domElement.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  const deltaMove = {
    x: e.movementX || e.mozMovementX || e.webkitMovementX || 0,
    y: e.movementY || e.mozMovementY || e.webkitMovementY || 0
  };

  rotationVelocity.y = deltaMove.x * 0.01;
  rotationVelocity.x = deltaMove.y * 0.01;
});

// --- Touch Events ---
renderer.domElement.addEventListener("touchstart", (e) => {
  isDragging = true;
  if (e.touches.length === 1) {
    previousMousePosition.x = e.touches[0].clientX;
    previousMousePosition.y = e.touches[0].clientY;
  }
});

renderer.domElement.addEventListener("touchend", () => {
  isDragging = false;
});

renderer.domElement.addEventListener("touchmove", (e) => {
  if (!isDragging || e.touches.length !== 1) return;

  const touch = e.touches[0];
  const deltaMove = {
    x: touch.clientX - previousMousePosition.x,
    y: touch.clientY - previousMousePosition.y
  };

  rotationVelocity.y = deltaMove.x * 0.01;
  rotationVelocity.x = deltaMove.y * 0.01;

  previousMousePosition.x = touch.clientX;
  previousMousePosition.y = touch.clientY;

  e.preventDefault(); // Prevent scrolling while dragging
}, { passive: false });

// Animate loop
function animate() {
  requestAnimationFrame(animate);

  if (mesh) {
    mesh.rotation.x += rotationVelocity.x;
    mesh.rotation.y += rotationVelocity.y;
  }


  rotationVelocity.x *= dampingFactor;
  rotationVelocity.y *= dampingFactor;

  renderer.render(scene, camera);
}

animate();
