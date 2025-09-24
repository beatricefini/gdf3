document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('pieces');
  const scale = 0.2; 

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

  for (let i = 0; i < modelIds.length; i++) {
    const piece = document.createElement('a-entity');
    piece.setAttribute('gltf-model', modelIds[i]);
    piece.setAttribute('position', positions[i]);
    piece.setAttribute('scale', { x: scale, y: scale, z: scale });
    container.appendChild(piece);
    pieces.push(piece);
  }

  // Drag variables
  let selectedPiece = null;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const zFixed = 0; // blocco della profondità

  function updateMouse(event){
    if(event.touches){
      mouse.x = (event.touches[0].clientX / window.innerWidth)*2-1;
      mouse.y = -(event.touches[0].clientY / window.innerHeight)*2+1;
    } else{
      mouse.x = (event.clientX / window.innerWidth)*2-1;
      mouse.y = -(event.clientY / window.innerHeight)*2+1;
    }
  }

  function onPointerDown(event){
    updateMouse(event);
    const camera = document.querySelector('a-camera');
    raycaster.setFromCamera(mouse, camera.getObject3D('camera'));

    const intersects = raycaster.intersectObjects(
      pieces.map(p => p.object3D), true
    );

    if(intersects.length > 0){
      selectedPiece = intersects[0].object.el;
    }
  }

  function onPointerMove(event){
    if(!selectedPiece) return;
    updateMouse(event);
    const camera = document.querySelector('a-camera');
    raycaster.setFromCamera(mouse, camera.getObject3D('camera'));

    const intersectionPoint = new THREE.Vector3();
    raycaster.ray.at((zFixed - raycaster.ray.origin.z)/raycaster.ray.direction.z, intersectionPoint);

    // Movimento bloccato sul piano X/Y
    selectedPiece.setAttribute('position', {
      x: intersectionPoint.x,
      y: intersectionPoint.y,
      z: zFixed // profondità bloccata
    });
  }

  function onPointerUp(){
    selectedPiece = null;
  }

  window.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  window.addEventListener('touchstart', onPointerDown, {passive:false});
  window.addEventListener('touchmove', onPointerMove, {passive:false});
  window.addEventListener('touchend', onPointerUp);
});
