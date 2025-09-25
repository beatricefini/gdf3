document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('pieces');

  const centerScale = 0.3;
  const zPos = 0;

  const modelIds = ['#piece1','#piece2','#piece3','#piece4','#piece5','#piece6'];
  const pieces = [];

  // Scala iniziale
  const initialScales = [0.15,0.35,0.15,0.2,0.35,0.35];

  // Posizioni personalizzate (ellisse verticale)
  const positions = [
    { x: -0.25, y: 0, z: zPos },   // piece1 sinistra
    { x: 0, y: 0.45, z: zPos },    // piece2 sopra
    { x: 0.25, y: 0, z: zPos },    // piece3 destra
    { x: -0.15, y: -0.45, z: zPos },// piece4 sotto
    { x: 0.15, y: -0.45, z: zPos }, // piece5 sotto
    { x: 0, y: 0.45, z: zPos }      // piece6 sopra
  ];

  // Funzione per creare i pezzi con animazione pop-up
  function createPiece(i) {
    const piece = document.createElement('a-entity');
    piece.setAttribute('gltf-model', modelIds[i]);
    piece.setAttribute('position', positions[i]);
    piece.setAttribute('scale', { x: 0, y: 0, z: 0 }); // inizio da 0
    piece.dataset.locked = "false";

    container.appendChild(piece);
    pieces.push(piece);

    // Animazione pop-up
    piece.setAttribute('animation__pop', {
      property: 'scale',
      to: `${initialScales[i]} ${initialScales[i]} ${initialScales[i]}`,
      dur: 500,
      delay: i * 300, // comparsa uno alla volta
      easing: 'easeOutElastic'
    });
  }

  // Creazione pezzi
  for (let i = 0; i < modelIds.length; i++) {
    createPiece(i);
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

  const centerPos = { x: 0, y: 0, z: zPos };
  const raggioSnap = 0.1;

  function checkSnap(piece) {
    const pos = piece.object3D.position;
    const distanza = Math.sqrt((pos.x - centerPos.x)**2 + (pos.y - centerPos.y)**2 + (pos.z - centerPos.z)**2);
    if (distanza < raggioSnap) {
      piece.setAttribute('position', { ...centerPos });
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
    currentPos.z = zPos;
    selectedPiece.setAttribute('position', {
      x: currentPos.x,
      y: currentPos.y,
      z: currentPos.z
    });

    checkSnap(selectedPiece);

    if(pieces.every(p => p.dataset.locked === "true")){
      pieces.forEach(p => { if(p.parentNode) p.parentNode.removeChild(p); });
      const finalShape = document.createElement('a-entity');
      finalShape.setAttribute('gltf-model','models/piece_final.glb');
      finalShape.setAttribute('position',{...centerPos});
      finalShape.setAttribute('scale',{x: centerScale, y: centerScale, z: centerScale});
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
});
