document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('pieces');
  const scale = 0.2;
  const modelIds = ['#piece1','#piece2','#piece3','#piece4','#piece5','#piece6'];
  const positions = [
    { x: -0.3, y: 0, z: 0 },
    { x: 0, y: -0.3, z: 0 },
    { x: 0.3, y: 0, z: 0 },
    { x: 0, y: 0.3, z: 0 },
    { x: 0.2, y: -0.2, z: 0 },
    { x: -0.2, y: 0.2, z: 0 }
  ];
  const pieces = [];

  for (let i = 0; i < modelIds.length; i++) {
    const piece = document.createElement('a-entity');
    piece.setAttribute('gltf-model', modelIds[i]);
    piece.setAttribute('position', positions[i]);
    piece.setAttribute('scale', { x: scale, y: scale, z: scale });
    container.appendChild(piece);
    pieces.push(piece);
  }

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

  function onPointerDown(event){
    updateMouse(event);
    raycaster.setFromCamera(mouse, cameraEl.getObject3D('camera'));

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
    raycaster.setFromCamera(mouse, cameraEl.getObject3D('camera'));

    // Calcolo posizione X/Y sul piano Z=0 del marker
    const distance = cameraEl.object3D.position.z; // distanza approssimativa della scena
    const dir = new THREE.Vector3();
    raycaster.ray.direction.clone().normalize().multiplyScalar(distance);
    const newPos = raycaster.ray.origin.clone().add(dir);

    selectedPiece.setAttribute('position', { x: newPos.x, y: newPos.y, z: 0 });
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
