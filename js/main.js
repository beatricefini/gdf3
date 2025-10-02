document.addEventListener("DOMContentLoaded", () => {
  const marker = document.getElementById("marker");
  const container = document.getElementById("pieces");
  const cameraEl = document.querySelector("a-camera");

  const modelIds = ['#piece1','#piece2','#piece3','#piece4','#piece5','#piece6'];
  const pieces = [];

  const positions = [
    { x: -0.2, y: 0, z: 0 },
    { x: -0.5, y: 0.6, z: 0 },
    { x: 0.2, y: 0, z: 0 },
    { x: 0.15, y: -0.5, z: 0 },
    { x: 0.15, y: -0.45, z: 0 },
    { x: -0.1, y: 0.3, z: 0 }
  ];

  const scales = [0.15,0.35,0.15,0.2,0.35,0.35];
  const centerPos = { x: 0, y: 0, z: 0 };
  const centerScale = 0.3;
  const raggioSnap = 0.1;

  // --- Overlay & scanner elements ---
  const intro = document.getElementById("introOverlay");
  const instructions = document.getElementById("instructionsOverlay");
  const tapText = document.getElementById("tapText");
  const scanningUI = document.getElementById("custom-scanning-ui");
  const sceneEl = document.querySelector("a-scene");

  // --- Mostra overlay iniziali ---
  setTimeout(() => intro.classList.add("show"), 100);
  setTimeout(() => {
    intro.classList.remove("show");
    intro.classList.add("hide");
    setTimeout(() => { 
      intro.remove(); 
      instructions.style.opacity = 1;
      setTimeout(() => instructions.classList.add("show"), 100);
      setTimeout(() => tapText.classList.add("show"), 500);

      instructions.addEventListener("click", async () => {
        instructions.classList.remove("show");
        instructions.classList.add("hide");
        setTimeout(()=> instructions.remove(), 1000);

        sceneEl.style.display = "flex";
        const mindarSystem = sceneEl.systems["mindar-image-system"];
        await mindarSystem.start();
      }, { once: true });
    }, 1000);
  }, 5000);

  // --- SCRITTA DRAG FRAGMENTS HERE ---
  const dragText = document.createElement('a-text');
  dragText.setAttribute('value', 'Drag\nFragments\nHere');
  dragText.setAttribute('align', 'center');
  dragText.setAttribute('color', '#FFD700');
  dragText.setAttribute('position', `${centerPos.x} ${centerPos.y + 0.05} ${centerPos.z}`);
  dragText.setAttribute('scale', '0.25 0.25 0.25');
  dragText.setAttribute('id', 'dragText');
  container.appendChild(dragText);

  // --- Funzione per creare i pezzi ---
  function createPiece(idx){
    const piece = document.createElement('a-entity');
    piece.setAttribute('gltf-model', modelIds[idx]);
    piece.setAttribute('position', { x: positions[idx].x, y: positions[idx].y, z: positions[idx].z });
    piece.setAttribute('scale', { x: 0, y: 0, z: 0 });
    piece.dataset.locked = "false";

    piece.addEventListener('model-loaded', () => {
      piece.setAttribute('animation__pop', {
        property: 'scale',
        from: '0 0 0',
        to: `${scales[idx]} ${scales[idx]} ${scales[idx]}`,
        dur: 500,
        easing: 'easeOutElastic'
      });
    });

    container.appendChild(piece);
    pieces.push(piece);
  }

  // --- Drag & Drop ---
  let selectedPiece = null;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function updateMouse(event){
    if(event.touches){
      mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
    } else {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
  }

  function checkSnap(piece){
    const pos = piece.object3D.position;
    const distanza = Math.sqrt((pos.x - centerPos.x)**2 + (pos.y - centerPos.y)**2 + (pos.z - centerPos.z)**2);
    if(distanza < raggioSnap){
      piece.setAttribute('position', {...centerPos});
      piece.setAttribute('scale', { x: centerScale, y: centerScale, z: centerScale });
      piece.dataset.locked = "true";
    }
  }

  function onPointerDown(event){
    updateMouse(event);
    raycaster.setFromCamera(mouse, cameraEl.getObject3D('camera'));
    const intersects = raycaster.intersectObjects(
      pieces.filter(p => p.dataset.locked === "false").map(p => p.object3D), true
    );
    if(intersects.length>0){
      selectedPiece = intersects[0].object.el;
      selectedPiece.object3D.position.y += 0.01;
    }
  }

  function onPointerMove(event){
    if(!selectedPiece || selectedPiece.dataset.locked === "true") return;
    updateMouse(event);
    raycaster.setFromCamera(mouse, cameraEl.getObject3D('camera'));

    const distance = cameraEl.object3D.position.z || 1;
    const dir = new THREE.Vector3();
    raycaster.ray.direction.clone().normalize().multiplyScalar(distance);
    const targetPos = raycaster.ray.origin.clone().add(dir);

    const currentPos = selectedPiece.object3D.position;
    const lerpFactor = 0.15;
    currentPos.x += (targetPos.x - currentPos.x) * lerpFactor;
    currentPos.y += (targetPos.y - currentPos.y) * lerpFactor;
    currentPos.z = 0;
    selectedPiece.setAttribute('position', currentPos);

    checkSnap(selectedPiece);

    if(pieces.every(p=>p.dataset.locked==='true')){
      const textEl = document.getElementById('dragText');
      if(textEl) textEl.parentNode.removeChild(textEl);

      pieces.forEach(p => { if(p.parentNode) p.parentNode.removeChild(p); });

      // --- CREA MODELLO FINALE ---
      const finalShape = document.createElement('a-entity');
      finalShape.setAttribute('gltf-model','models/piece_final.glb');
      finalShape.setAttribute('position',{...centerPos});
      finalShape.setAttribute('scale',{x:centerScale, y:centerScale, z:centerScale});
      container.appendChild(finalShape);

      // --- ANIMAZIONE FLUTTUANTE ---
      finalShape.setAttribute('animation__float', {
        property: 'position',
        dir: 'alternate',
        dur: 1000,
        easing: 'easeInOutSine',
        loop: true,
        to: `${centerPos.x} ${centerPos.y + 0.3} ${centerPos.z}`
      });

      // --- DOPO 3 SECONDI ---
      setTimeout(() => {
        finalShape.removeAttribute('animation__float');
        const finalPos = { x: -0.2, y: 0.5, z: 0 };
        finalShape.setAttribute('animation__move', {
          property: 'position',
          to: `${finalPos.x} ${finalPos.y} ${finalPos.z}`,
          dur: 1000,
          easing: 'easeInOutQuad'
        });
        finalShape.setAttribute('animation__scale', {
          property: 'scale',
          to: '0.1 0.1 0.1',
          dur: 1000,
          easing: 'easeInOutQuad'
        });

        // --- CREA MODELLO CINEMA ---
        const baseHeight = -0.25;
        const cinemaModel = document.createElement('a-entity');
        cinemaModel.setAttribute('gltf-model', 'models/piece_cinema3.glb');
        cinemaModel.setAttribute('position', { x: 0.05, y: baseHeight, z: 0 });
        cinemaModel.setAttribute('scale', { x: 0.8, y: 0.8, z: 0.8 });
        container.appendChild(cinemaModel);

        // --- Testo "1960" ---
        const text1960 = document.createElement('a-text');
        text1960.setAttribute('value', '1960');
        text1960.setAttribute('align', 'center');
        text1960.setAttribute('anchor', 'center');
        text1960.setAttribute('color', '#000000');
        text1960.setAttribute('font', 'roboto');
        text1960.setAttribute('position', { x: 0, y: baseHeight + 0.5, z: 0 });
        text1960.setAttribute('scale', '0.35 0.35 0.35');
        text1960.setAttribute('opacity', '0');
        text1960.setAttribute('shader', 'msdf');
        text1960.setAttribute('negate', 'false');
        text1960.setAttribute('animation__fadein', {
          property: 'opacity',
          from: 0,
          to: 1,
          dur: 800,
          easing: 'easeInQuad',
          delay: 200
        });
        container.appendChild(text1960);

        // --- Testo "Sculpture" ---
        const textSculpture = document.createElement('a-text');
        textSculpture.setAttribute('value', 'Sculpture');
        textSculpture.setAttribute('align', 'center');
        textSculpture.setAttribute('anchor', 'center');
        textSculpture.setAttribute('color', '#000000');
        textSculpture.setAttribute('font', 'roboto');
        textSculpture.setAttribute('position', { x: 0, y: baseHeight + 0.35, z: 0 });
        textSculpture.setAttribute('scale', '0.25 0.25 0.25');
        textSculpture.setAttribute('opacity', '0');
        textSculpture.setAttribute('shader', 'msdf');
        textSculpture.setAttribute('negate', 'false');
        textSculpture.setAttribute('animation__fadein', {
          property: 'opacity',
          from: 0,
          to: 1,
          dur: 800,
          easing: 'easeInQuad',
          delay: 1200
        });
        container.appendChild(textSculpture);

      }, 3000);
    }
  }

  function onPointerUp(){
    if(selectedPiece){
      selectedPiece.object3D.position.y -= 0.01;
      selectedPiece = null;
    }
  }

  window.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);
  window.addEventListener('touchstart', onPointerDown, {passive:false});
  window.addEventListener('touchmove', onPointerMove, {passive:false});
  window.addEventListener('touchend', onPointerUp);

  // --- POP-UP ANIMATION DOPO TARGET FOUND ---
  marker.addEventListener('targetFound', () => {
    pieces.length = 0;
    let delay = 0;
    for(let i=0;i<modelIds.length;i++){
      setTimeout(()=> createPiece(i), delay);
      delay += 700;
    }
  });

  // --- Overlay finale 10 secondi dopo modello finale ---
  setTimeout(() => {
    const outroOverlay = document.createElement('div');
    outroOverlay.id = "outroOverlay";
    outroOverlay.style.position="fixed";
    outroOverlay.style.top="0";
    outroOverlay.style.left="0";
    outroOverlay.style.width="100vw";
    outroOverlay.style.height="100vh";
    outroOverlay.style.backgroundColor="black";
    outroOverlay.style.display="flex";
    outroOverlay.style.justifyContent="center";
    outroOverlay.style.alignItems="center";
    outroOverlay.style.zIndex="9999";
    outroOverlay.style.opacity="0";
    outroOverlay.style.transition="opacity 1s ease-in-out";

    const img = document.createElement("img");
    img.src="images/outro3.png";
    img.style.maxWidth="100%";
    img.style.maxHeight="100%";
    outroOverlay.appendChild(img);

    document.body.appendChild(outroOverlay);
    setTimeout(()=>{outroOverlay.style.opacity="1";},100);
  }, 10000);

});
