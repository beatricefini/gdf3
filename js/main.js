document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('#modelsContainer');

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
  startText.setAttribute('value','Tap the screen\nto place your models');
  startText.setAttribute('align','center');
  startText.setAttribute('color','#FFFFFF');
  startText.setAttribute('position','0 1.8 -1');
  startText.setAttribute('scale','4 4 4');
  startText.setAttribute('width','2');
  startText.setAttribute('font','mozillavr');
  container.appendChild(startText);

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

  // Posizioni relative alla hit-test (all'inizio sono vuote)
  const placedPositions = [];

  // Funzione per creare modello
  function placeModel(hitPosition) {
    if(currentIndex >= models.length) return;

    const piece = document.createElement('a-entity');
    piece.setAttribute('gltf-model', models[currentIndex]);
    piece.setAttribute('data-raycastable','true');

    // Posizione dal mondo reale (hit-test)
    piece.setAttribute('position', hitPosition);

    // Scala iniziale 0 per pop-up
    piece.setAttribute('scale', { x:0, y:0, z:0 });

    const rotX = (Math.random() - 0.5) * 10;
    const rotY = (Math.random() - 0.5) * 10;
    piece.setAttribute('rotation', { x: rotX, y: rotY, z: 0 });

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
      piece.setAttribute('id','piece7');
    }

    piece.addEventListener('model-loaded', () => {
      console.log(`✅ Modello caricato: ${models[currentIndex]}`);
    });

    container.appendChild(piece);
    currentIndex++;
    modelsAdded++;

    // Video piece7
    if(modelsAdded === models.length) {
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
      },3000);
    }
  }

  // Click sullo schermo con hit-test
  window.addEventListener('click', (evt) => {
    if(firstClick){
      if(startText) startText.setAttribute('visible','false');
      firstClick = false;
      return;
    }

    const sceneEl = document.querySelector('a-scene');
    const camera = document.querySelector('#camera');

    // Raycast dal centro dello schermo
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(0,0); // centro dello schermo
    const cameraObj = camera.getObject3D('camera');
    raycaster.setFromCamera(mouse, cameraObj);

    // AR hit-test (tutte le entità con piano AR)
    sceneEl.querySelectorAll('a-plane, a-entity').forEach(entity => {
      const mesh = entity.getObject3D('mesh');
      if(mesh){
        const intersects = raycaster.intersectObject(mesh, true);
        if(intersects.length > 0){
          const hitPos = intersects[0].point;
          placeModel({ x: hitPos.x, y: hitPos.y, z: hitPos.z });
        }
      }
    });
  });
});
