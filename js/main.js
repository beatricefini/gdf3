document.addEventListener("DOMContentLoaded", () => {
  const marker = document.getElementById("marker");
  const container = document.getElementById("pieces");
  const cameraEl = document.querySelector("a-camera");

  const modelIds = ['#piece1','#piece2','#piece3','#piece4','#piece5','#piece6'];
  const pieces = [];

  // Posizioni ellittiche come richiesto
  const positions = [
    { x: -0.25, y: 0, z: 0 },   // piece1 a sinistra
    { x: 0, y: 0.45, z: 0 },    // piece2 sopra
    { x: 0.25, y: 0, z: 0 },    // piece3 a destra
    { x: -0.15, y: -0.45, z: 0 }, // piece4 sotto sinistra
    { x: 0.15, y: -0.45, z: 0 },  // piece5 sotto destra
    { x: -0.05, y: 0.35, z: 0 }   // piece6 sopra leggermente a sinistra
  ];

  // Scale iniziali (puoi regolare)
  const scales = [0.15,0.35,0.15,0.2,0.35,0.35];
  const centerPos = { x: 0, y: 0, z: 0 };
  const centerScale = 0.3;
  const raggioSnap = 0.1;

  // Funzione per creare un pezzo
  function createPiece(idx){
    const piece = document.createElement('a-entity');
    piece.setAttribute('gltf-model', modelIds[idx]);
    piece.setAttribute('position', { x: positions[idx].x, y: positions[idx].y, z: positions[idx].z });
    piece.setAttribute('scale', { x: 0, y: 0, z: 0 }); // parte invisibile
    piece.dataset.locked = "false";

    piece.addEventListener('model-loaded', () => {
      // animazione pop-up verso la posizione e scala definitiva
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

  // Drag & drop
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
    currentPos.z = 0; // piano marker
    selectedPiece.setAttribute('position', currentPos);

    checkSnap(selectedPiece);

    if(pieces.every(p=>p.dataset.locked==='true')){
      pieces.forEach(p => { if(p.parentNode) p.parentNode.removeChild(p); });
      const finalShape = document.createElement('a-entity');
      finalShape.setAttribute('gltf-model','models/piece_final.glb');
      finalShape.setAttribute('position',{...centerPos});
      finalShape.setAttribute('scale',{x:centerScale, y:centerScale, z:centerScale});
      container.appendChild(finalShape);
      finalShape.setAttribute('animation__float', {
        property: 'position',
        dir: 'alternate',
        dur: 1000,
        easing: 'easeInOutSine',
        loop: true,
        to: `${centerPos.x} ${centerPos.y + 0.3} ${centerPos.z}`
      });
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
    pieces.length = 0; // reset in caso
    let delay = 0;
    for(let i=0;i<modelIds.length;i++){
      setTimeout(()=> createPiece(i), delay);
      delay += 700; // 700ms tra un pezzo e l'altro
    }
  });
});
