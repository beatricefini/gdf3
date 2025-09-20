// js/main.js
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('#modelsContainer');
  const overlay = document.getElementById('overlay');

  // Video per piece7
  const video7 = document.createElement('video');
  video7.src = 'videos/video7.mp4';
  video7.crossOrigin = 'anonymous';
  video7.loop = true;
  video7.muted = true;
  video7.autoplay = false;
  document.body.appendChild(video7);

  let firstClick = true;
  let currentIndex = 0;
  let modelsAdded = 0;

  const models = [
    'models/piece1.glb',
    'models/piece2.glb',
    'models/piece3.glb',
    'models/piece4.glb',
    'models/piece5.glb',
    'models/piece6.glb',
    'models/piece7.glb'
  ];

  window.addEventListener('click', () => {
    if (firstClick) {
      overlay.style.display = 'none';
      firstClick = false;
      return;
    }

    if (currentIndex >= models.length) return;

    const piece = document.createElement('a-entity');
    piece.setAttribute('gltf-model', models[currentIndex]);
    piece.setAttribute('scale', '0 0 0');

    // Posizioni predefinite RELATIVE al marker
    let pos = { x: 0, y: 0, z: 0 };

    if (currentIndex <= 2) {
      // piece1-3 "sul pavimento" vicino al marker
      pos = { x: (currentIndex - 1) * 0.5, y: 0, z: 0 };
    } else if (currentIndex === models.length - 1) {
      // piece7 più in alto (come se fosse su un muro)
      pos = { x: 0, y: 1.5, z: 0 };
    } else {
      // altri un po' dietro
      pos = { x: 0, y: 0.5, z: -0.5 - (currentIndex * 0.1) };
    }

    piece.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);

    // Animazione comparsa
    piece.setAttribute('animation__pop', {
      property: 'scale',
      from: '0 0 0',
      to: '0.5 0.5 0.5',
      dur: 800,
      easing: 'easeOutElastic'
    });

    if (currentIndex === models.length - 1) {
      piece.setAttribute('id', 'piece7');
    }

    container.appendChild(piece);
    currentIndex++;
    modelsAdded++;

    // Se abbiamo aggiunto tutti i modelli → avvia il video su piece7
    if (modelsAdded === models.length) {
      setTimeout(() => {
        const piece7El = document.getElementById('piece7');
        if (piece7El) {
          const mesh = piece7El.getObject3D('mesh');
          if (mesh) {
            mesh.traverse((node) => {
              if (node.isMesh) {
                const videoTexture = new THREE.VideoTexture(video7);
                videoTexture.flipY = false;
                videoTexture.center.set(0.5, 0.5);
                videoTexture.repeat.x = -1;
                node.material.map = videoTexture;
                node.material.needsUpdate = true;
              }
            });
          }
          video7.play().catch((e) => console.warn("Impossibile avviare il video:", e));
        }
      }, 3000);
    }
  });
});
