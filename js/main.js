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

  // Creazione dei pezzi
  for (let i = 0; i < modelIds.length; i++) {
    const piece = document.createElement('a-entity');
    piece.setAttribute('gltf-model', modelIds[i]);
    piece.setAttribute('position', positions[i]);
    piece.setAttribute('scale', { x: scale, y: scale, z: scale });
    container.appendChild(piece);
    pieces.push(piece);
  }

  // Creiamo un piano invisibile sopra il marker per il touch
  const plane = document.createElement('a-plane');
  plane.setAttribute('position', {x:0, y:0, z:0});
  plane.setAttribute('rotation', '-90 0 0'); // piano orizzontale
  plane.setAttribute('width', 1);
  plane.setAttribute('height', 1);
  plane.setAttribute('visible', false);
  container.appendChild(plane);

  // Drag variables
  let selectedPiece = null;
  const camera = document.querySelector('a-camera');
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function updateMouse(event){
    if(event.touches){
      mouse.x = (event.touches[0].clientX / window.innerWidth)*2-1;
      mouse.y = -(event.touches[0].clientY / window.innerHeight)*2+1;
    } else {
      mouse.x = (event.clientX / window.innerWidth)*2-1;
      mouse.y = -(event.clientY / window.innerHeight)*2+1;
    }
  }

  function onPointerDown(event){
    updateMouse(event);
    raycaster.setFromCamera(mouse, camera.getObject3D('camera'));

    const intersects = raycaster.intersectObjects(
      pieces.map(p => p.object3D), true
    );

    if(intersects.length > 0){
      selectedPiece = intersects[0].object.el;
      selectedPiece.object3D.position.y += 0.01; // piccolo feedback di selezione
    }
  }

  function onPointerMove(event){
    if(!selectedPiece) return;
    updateMouse(event);
    raycaster.setFromCamera(mouse, camera.getObject3D('camera'));

    const intersects = raycaster.intersectObject(plane.object3D, true);
    if(intersects.length > 0){
      const point = intersects[0].point;
      selectedPiece.setAttribute('position', { x: point.x, y: point.z, z: 0 });
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
