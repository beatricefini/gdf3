document.addEventListener('DOMContentLoaded', () => {
  // Attiva la camera AR
  const video = document.getElementById('cameraVideo');
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => { video.srcObject = stream; })
    .catch(err => console.error("Impossibile accedere alla camera:", err));

  // Container dei modelli
  const container = document.getElementById('modelsContainer');
  if(!container) console.error("❌ modelsContainer non trovato nel DOM!");

  // Lista modelli GLB
  const models = [
    'models/piece1.glb',
    'models/piece2.glb',
    'models/piece3.glb',
    'models/piece4.glb',
    'models/piece5.glb',
    'models/piece6.glb',
    'models/piece7.glb'
  ];

  let currentIndex = 0;
  let modelsAdded = 0;

  // Posizione fissa del container
  container.setAttribute('position', { x:0, y:1.5, z:-3 });

  // Video HTML per piece7
  const video7 = document.createElement('video');
  video7.setAttribute('id', 'video7');
  video7.setAttribute('src', 'video/piece7.mp4'); // assicurati che il file sia nella cartella video/
  video7.setAttribute('loop', '');
  video7.setAttribute('autoplay', 'false');
  video7.setAttribute('playsinline', '');
  video7.setAttribute('webkit-playsinline', '');
  document.body.appendChild(video7);

  // Scritta iniziale
  const startText = document.createElement('a-text');
  startText.setAttribute('id','startText');
  startText.setAttribute('value','Tap the screen\nto create your\nown little cinema');
  startText.setAttribute('align','center');
  startText.setAttribute('color','#FFFFFF');
  startText.setAttribute('position',{x:0, y:1.8, z:-1});
  startText.setAttribute('scale',{x:2,y:2,z:2});
  startText.setAttribute('width','2');
  startText.setAttribute('font','mozillavr');
  container.appendChild(startText);

  let firstClick = true;

  // Click sullo schermo
  window.addEventListener('click', () => {
    // Al primo click scompare la scritta iniziale
    if(firstClick){
      if(startText) startText.setAttribute('visible','false');
      firstClick = false;
      return; // non generiamo ancora modelli
    }

    if(currentIndex >= models.length) return;

    const piece = document.createElement('a-entity');
    piece.setAttribute('gltf-model', models[currentIndex]);
    piece.setAttribute('data-raycastable','true');

    // Scala iniziale 0 per pop-up
    piece.setAttribute('scale', { x:0, y:0, z:0 });

    // Piccolo sbilanciamento iniziale
    const rotX = (Math.random() - 0.5) * 10;
    const rotY = (Math.random() - 0.5) * 10;
    piece.setAttribute('rotation', { x: rotX, y: rotY, z: 0 });

    // Pop-up animazione
    piece.setAttribute('animation__pop', {
      property: 'scale',
      from: '0 0 0',
      to: '0.5 0.5 0.5',
      dur: 800,
      easing: 'easeOutElastic'
    });

    // Stabilizzazione rotazione
    piece.setAttribute('animation__stabilize', {
      property: 'rotation',
      to: '0 0 0',
      dur: 300,
      easing: 'easeOutQuad'
    });

    // Assegna id a piece7 per identificarlo
    if(currentIndex === models.length - 1){
      piece.setAttribute('id','piece7');
    }

    piece.addEventListener('model-loaded', () => {
      console.log(`✅ Modello caricato: ${models[currentIndex]}`);
    });

    container.appendChild(piece);
    currentIndex++;
    modelsAdded++;

    // Quando tutti i modelli sono comparsi, avvia video piece7 dopo 3 secondi
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
                videoTexture.repeat.x = -1; // specchia il video
                node.material.map = videoTexture;
                node.material.needsUpdate = true;
              }
            });
          }
          video7.play().catch(e => console.warn("Impossibile avviare il video:", e));
        }
      },3000);
    }
  });
});
