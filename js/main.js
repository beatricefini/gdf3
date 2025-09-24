document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('pieces');
  const scale = 0.2; // scala dei modelli

  // Posizioni manuali
  const positions = [
    { x: -0.3, y: 0, z: 0 },   // piece1: sinistra
    { x: 0, y: -0.3, z: 0 },   // piece2: basso
    { x: 0.3, y: 0, z: 0 },    // piece3: destra
    { x: 0, y: 0.3, z: 0 },    // piece4: alto
    { x: 0.2, y: -0.2, z: 0 }, // piece5: basso a destra
    { x: -0.2, y: 0.2, z: 0 }  // piece6: alto a sinistra
  ];

  const modelIds = ['#piece1','#piece2','#piece3','#piece4','#piece5','#piece6'];

  for (let i = 0; i < modelIds.length; i++) {
    const piece = document.createElement('a-entity');
    piece.setAttribute('gltf-model', modelIds[i]);
    piece.setAttribute('position', positions[i]);
    piece.setAttribute('scale', { x: scale, y: scale, z: scale });

    container.appendChild(piece);
  }
});
