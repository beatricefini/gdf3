document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("pieces");
  const camera = document.querySelector("a-camera");
  const marker = document.getElementById("marker"); // marker MindAR

  const models = ['#piece1','#piece2','#piece3','#piece4','#piece5','#piece6'];

  const positions = [
    { x: 0.25, y: 0, z: 0 },      // piece1 destra
    { x: 0, y: 0.45, z: 0 },      // piece2 sopra
    { x: -0.25, y: 0, z: 0 },     // piece3 sinistra
    { x: -0.15, y: -0.45, z: 0 }, // piece4 sotto
    { x: 0.15, y: -0.45, z: 0 },  // piece5 sotto
    { x: -0.05, y: 0.35, z: 0 }   // piece6 sopra e leggermente a sinistra
  ];

  const originalTransforms = {};
  const pieces = [];
  let currentIndex = 0;

  const centerPos = { x: 0, y: 0, z: 0 };
  const raggioSnap = 0.1;
  const centerScale = 0.3;

  let selectedPiece = null;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // --- Drag & Snap Functions ---
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
    const distanza = Math.sqrt((pos.x - centerPos.x)**2 + (pos.y - centerPos.y)**2 + (pos.z - centerPos.z)**2);
    if (distanza < raggioSnap) {
      piece.setAttribute('position', centerPos);
      piece.setAttribute('scale', {x: centerScale, y: centerScale, z: centerScale});
      piece.dataset.locked = "true";
    }
  }

  function onPointerDown(event){
    updateMouse(event);
    raycaster.setFromCamera(mouse, camera.getObject3D('camera'));

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
    raycaster.setFromCamera(mouse, camera.getObject3D('camera'));

    const distance = camera.object3D.position.z || 1;
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

    if(pieces.every(p => p.dataset.locked === "true") && !document.getElementById('finalShape')){
      pieces.forEach(p => { if(p.parentNode) p.parentNode.removeChild(p); });

      const finalShape = document.createElement('a-entity');
      finalShape.setAttribute('gltf-model','models/piece_final.glb');
      finalShape.setAttribute('position', centerPos);
      finalShape.setAttribute('scale', {x: centerScale, y: centerScale, z: centerScale});
      finalShape.setAttribute('id','finalShape');
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

  // --- Funzione pop-up sequenziale dopo target found ---
  function showNextPiece() {
    if(currentIndex >= models.length) return;

    const idx = currentIndex;
    const piece = document.createElement("a-entity");
    piece.setAttribute("gltf-model", models[idx]);
    piece.setAttribute("position", positions[idx]);
    piece.setAttribute("scale", "0 0 0");
    piece.setAttribute("visible", "false");
    container.appendChild(piece);
    pieces.push(piece);

    piece.addEventListener("model-loaded", () => {
      const scale = { x: 0.2, y: 0.2, z: 0.2 };
      originalTransforms[idx] = { position: positions[idx], scale: scale };

      piece.setAttribute("visible", "true");
      piece.setAttribute("animation__pop", {
        property: "scale",
        from: "0 0 0",
        to: `${scale.x} ${scale.y} ${scale.z}`,
        dur: 500,
        easing: "easeOutElastic"
      });
    });

    currentIndex++;
    setTimeout(showNextPiece, 400);
  }

  // --- Avvia pop-up solo dopo che il marker è trovato ---
  marker.addEventListener("targetFound", () => {
    setTimeout(() => {
      showNextPiece();
    }, 500); // 500ms di delay per sicurezza
  });
});
