document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('pieces');
  const scale = 0.2;

  // Posizioni iniziali manuali
  const positions = [
    { x: -0.3, y: 0, z: 0 },
    { x: 0, y: -0.3, z: 0 },
    { x: 0.3, y: 0, z: 0 },
    { x: 0, y: 0.3, z: 0 },
    { x: 0.2, y: -0.2, z: 0 },
    { x: -0.2, y: 0.2, z: 0 }
  ];

  const modelIds = ['#piece1','#piece2','#piece3','#piece4','#piece5','#piece6'];
  const pieces = [];

  // Centro e snap
  const centerPos = { x: 0, y: 0, z: 0 };
  const raggioSnap = 0.1;
  const pezzoSnapScale = 0.25;

  // Creazione dei pezzi
  for (let i = 0; i < modelIds.length; i++) {
    const piece = document.createElement('a-entity');
    piece.setAttribute('gltf-model', modelIds[i]);
    piece.setAttribute('position', positions[i]);
    piece.setAttribute('scale', { x: scale, y: scale, z: scale });
    piece.dataset.locked = "false"; // inizialmente sbloccato
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
      piece.setAttribute('scale', { x: pezzoSnapScale, y: pezzoSnapScale, z: pezzoSnapScale });
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
      // rimuove pezzi originali
      pieces.forEach(p => { if(p.parentNode) p.parentNode.removeChild(p); });

      const finalShape = document.createElement('a-entity');
      finalShape.setAttribute('gltf-model','models/piece_final.glb');
      finalShape.setAttribute('position',{...centerPos});
      finalShape.setAttribute('scale',{x:0.5, y:0.5, z:0.5});
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
