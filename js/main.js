document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('pieces');

  const centerScale = 0.3; // scala dei pezzi al centro e del modello finale
  const raggio = 0.3;      // distanza dal centro per la disposizione circolare

  const modelIds = ['#piece1','#piece2','#piece3','#piece4','#piece5','#piece6'];
  const pieces = [];

  // Scala iniziale ottimizzata per uniformare visivamente i pezzi più piccoli
  const initialScales = [
    0.25, // piece1
    0.35, // piece2 più piccolo
    0.25, // piece3
    0.35, // piece4 più piccolo
    0.35, // piece5 più piccolo
    0.35  // piece6 più piccolo
  ];

  // Centro e snap
  const centerPos = { x: 0, y: 0, z: 0 };
  const raggioSnap = 0.1;

  // Creazione dei pezzi in cerchio con scale ottimizzate
  for (let i = 0; i < modelIds.length; i++) {
    const angle = (i / modelIds.length) * Math.PI * 2;
    const x = Math.cos(angle) * raggio;
    const y = Math.sin(angle) * raggio;

    const piece = document.createElement('a-entity');
    piece.setAttribute('gltf-model', modelIds[i]);
    piece.setAttribute('position', { x, y, z: 0 });
    piece.setAttribute('scale', {
      x: initialScales[i],
      y: initialScales[i],
      z: initialScales[i]
    });
    piece.dataset.locked = "false";
    container.appendChild(piece);
    pieces.push(piece);
  }

  // Drag variables
  let selectedPiece = null;
  const cameraEl = document.querySelector('a-camera');
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

  function checkSnap(piece) {
    const pos = piece.object3D.position;
    const distanza = Math.sqrt((pos.x - centerPos.x)**2 + (pos.y - centerPos.y)**2);
    if (distanza < raggioSnap) {
      piece.setAttribute('position', { ...centerPos, z: 0 });
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

    if(intersects.length > 0){
      selectedPiece = intersects[0].object.el;
      selectedPiece.object3D.position.y += 0.01; // piccolo feedback
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

    // Movimento fluido
    const currentPos = selectedPiece.object3D.position;
    const lerpFactor = 0.15;
    currentPos.x += (targetPos.x - currentPos.x) * lerpFactor;
    currentPos.y += (targetPos.y - currentPos.y) * lerpFactor;
    currentPos.z = 0;
    selectedPiece.setAttribute('position', {
      x: currentPos.x,
      y: currentPos.y,
      z: 0
    });

    // Snap automatico
    checkSnap(selectedPiece);

    // Se tutti i pezzi sono bloccati, mostra pezzo finale
    if(pieces.every(p => p.dataset.locked === "true")){
      pieces.forEach(p => { if(p.parentNode) p.parentNode.removeChild(p); });

      const finalShape = document.createElement('a-entity');
      finalShape.setAttribute('gltf-model','models/piece_final.glb');
      finalShape.setAttribute('position',{...centerPos});
      finalShape.setAttribute('scale',{x: centerScale, y: centerScale, z: centerScale});
      container.appendChild(finalShape);

      // animazione fluttuazione
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
      selectedPiece.object3D.position.y -= 0.01; // reset feedback
      selectedPiece = null;
    }
  }

  // Eventi desktop
  window.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  // Eventi touch mobile
  window.addEventListener('touchstart', onPointerDown, {passive:false});
  window.addEventListener('touchmove', onPointerMove, {passive:false});
  window.addEventListener('touchend', onPointerUp);
});

