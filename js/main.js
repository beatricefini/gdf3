// js/main.js

document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('#modelsContainer');

  // Video per piece7
  const video7 = document.createElement('video');
  video7.id = 'video7';
  video7.src = 'videos/video7.mp4';
  video7.crossOrigin = 'anonymous';
  video7.loop = true;
  video7.muted = true;
  video7.autoplay = false;
  document.body.appendChild(video7);

  // Scritta iniziale
  const startText = document.createElement('a-text');
  startText.setAttribute('id','startText');
  startText.setAttribute('value','Tap the screen\nto create your\nown little cinema');
  startText.setAttribute('align','center');
  startText.setAttribute('color','#FFFFFF');
  startText.setAttribute('position','0 1.8 -1');
  startText.setAttribute('scale','4 4 4');
  startText.setAttribute('width','2');
  startText.setAttribute('font','mozillavr');
  container.appendChild(startText);

  let firstClick = true;
  let currentIndex = 0;

  const models = [
    'models/piece1.glb',
    'models/piece2.glb',
    'models/piece3.glb',
    'models/piece4.glb',
    'models/piece5.glb',
    'models/piece6.glb',
    'models/piece7.glb'
  ];

  let floorY = 0;  // default pavimento
  let wallZ = -3;  // default muro

  const cameraEl = document.querySelector('#camera');

  // Funzione per rilevare pavimento e muro all'avvio
  function detectSurfaces() {
    const cameraObj = cameraEl.getObject3D('camera');

    // Raycast verso il basso per pavimento
    const rayDown = new THREE.Raycaster(cameraObj.position, new THREE.Vector3(0, -1, 0));
    const intersectsFloor = rayDown.intersectObjects([]);
    floorY = intersectsFloor.length > 0 ? intersectsFloor[0].point.y : 0;

    // Raycast in avanti per muro
    const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(cameraObj.quaternion);
    const rayForward = new THREE.Raycaster(cameraObj.position, forwardDir);
    const intersectsWall = rayForward.intersectObjects([]);
    wallZ = intersectsWall.length > 0 ? intersectsWall[0].point.z : -3;
  }

  // Esegui rilevazione superfici dopo 2 secondi
  setTimeout(detectSurfaces, 2000);

  window.addEventListener('click', () => {
    if(firstClick){
      if(startText) startText.setAttribute('visible','false');
      firstClick = false;
      return;
    }

    if(currentIndex >= models.length) return;

    const piece = document.createElement('a-entity');
    piece.setAttribute('gltf-model', models[currentIndex]);
    piece.setAttribute('data-raycastable', 'true');

    // Posizione predefinita basata sulle superfici rilevate
    let pos = { x: 0, y: floorY, z: -2 };

    if(currentIndex <= 2) {
      // piece1-3 sul pavimento
      pos = { x: (currentIndex - 1) * 0.5, y: floorY, z: -2 };
    } else if(currentIndex === models.length - 1) {
      // piece7 vicino al muro
      pos = { x: 0, y: floorY + 1.5, z: wallZ };
    } else {
      // altri modelli
      pos = { x: (currentIndex % 2) * 0.5 - 0.25, y: floorY, z: -2.5 - (currentIndex*0.2) };
    }

    piece.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);

    // Scala iniziale 0
    piece.setAttribute('scale', { x:0, y:0, z:0 });

    // Piccolo sbilanciamento iniziale
    const rotX = (Math.random() - 0.5) * 10;
    const rotY = (Math.random() - 0.5) * 10;
    piece.setAttribute('rotation', { x: rotX, y: rotY, z: 0 });

    // Animazioni pop-up
    piece.setAttribute('animation__pop', {
      property: 'scale',
      from: '0 0 0',
      to: '0.5 0.5 0.5',
      dur: 800,
      easing: 'easeOutElastic'
    });

    piece.setAttribute('animation__stabilize', {
      property: 'rotation',
      to: '0 0 0',
      dur: 300,
      easing: 'easeOutQuad'
    });

    if(currentIndex === models.length - 1){
      piece.setAttribute('id', 'piece7');
    }

    piece.addEventListener('model-loaded', () => {
      console.log(`✅ Modello caricato: ${models[currentIndex]}`);
    });

    container.appendChild(piece);
    currentIndex++;

    // Avvio video su piece7
    if(currentIndex === models.length){
      setTimeout(() => {
        const piece7El = document.getElementById('piece7');
        if(piece7El){
          const mesh = piece7El.getObject3D('mesh');
          if(mesh){
            mesh.traverse(node => {
              if(node.isMesh){
                const videoTexture = new THREE.VideoTexture(video7);
                videoTexture.flipY = false;
                videoTexture.center.set(0.5,0.5);
                videoTexture.repeat.x = -1;
                node.material.map = videoTexture;
                node.material.needsUpdate = true;
              }
            });
          }
          video7.play().catch(e => console.warn("Impossibile avviare il video:", e));
        }
      }, 3000);
    }
  });
});
