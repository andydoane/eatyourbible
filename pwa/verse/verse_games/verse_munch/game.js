function spawnChewCrumbs(isSecondary = false){
  const center = getMouthPoint();
  const crumbColors = ["#f6dfa6", "#f7c96d", "#fff4cf", "#f4b66a", "#ffffff"];
  const countPerSide = isSecondary ? 4 : 6;
  const s = state.scale || 1;

  for (const dir of [-1, 1]){
    for (let i = 0; i < countPerSide; i++){
      const speedX = (90 + Math.random() * (isSecondary ? 60 : 90)) * s;
      const speedY = (45 + Math.random() * 70) * s;

      state.particles.push({
        type: "dot",
        x: center.x + dir * (6 + Math.random() * 8) * s,
        y: center.y + (Math.random() * 12 - 4) * s,
        vx: dir * speedX,
        vy: -speedY,
        gravity: (240 + Math.random() * 80) * s,
        age: 0,
        life: 0.34 + Math.random() * 0.18,
        size: (6 + Math.random() * 7) * s,
        color: randomFrom(crumbColors)
      });
    }
  }
}
