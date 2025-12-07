/**
 * Initializes boat animation on window load
 * Animates an SVG boat element along a path by updating its startOffset
 */
window.onload = () => {
  requestAnimationFrame(() => {
    const boatPath = document.getElementById('boat');

    if (boatPath instanceof SVGTextPathElement) {
      let offset = 0;

      const moveBoat = () => {
        offset += 0.5;
        if (offset > 100) offset = 0;
        boatPath.setAttribute('startOffset', `${offset}%`);
        requestAnimationFrame(moveBoat);
      };

      moveBoat();
    } else {
      console.error("🚤 #boat not found or not SVGTextPathElement");
    }
  });
};
