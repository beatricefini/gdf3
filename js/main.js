document.body.appendChild(video7);

// Scritta iniziale
const startText = document.createElement('a-text');
startText.setAttribute('id','startText');
startText.setAttribute('value','Tap the screen\nto create your\nown little cinema');
startText.setAttribute('align','center');
startText.setAttribute('color','#FFFFFF');
startText.setAttribute('position',{x:0, y:1.8, z:-1});
startText.setAttribute('scale',{x:4,y:4,z:4});
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
              videoTexture.flipY = false;      // mantiene il video dritto
              videoTexture.center.set(0.5,0.5);
              videoTexture.repeat.x = -1;      // specchia il video
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
