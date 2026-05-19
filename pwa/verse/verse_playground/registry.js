window.EXTERNAL_VERSE_PLAYGROUND = [
  {
    enabled: true,
    manifest: {
      id: "verse_jam",
      title: "Verse Jam",
      description: "Tap each verse chunk like an instrument while the beat plays.",
      icon: "🎹",
      cardColor: "#2b1748",
      cardTextColor: "#ffffff",
      launchUrl: "./verse_playground/verse_jam/index.html",
      visibleInCarousel: true,
      progressType: "practice",
      modes: ["beginner", "advanced"]
    }
  },
  {
    enabled: true,
    manifest: {
      id: "scripture_scrub",
      title: "Scripture Scrub",
      description: "Wipe, rake, peel, and dig to reveal the verse.",
      icon: "🧽",
      cardColor: "#40b9c5",
      cardTextColor: "#ffffff",
      launchUrl: "./verse_playground/scripture_scrub/index.html",
      visibleInCarousel: true
    }
  },
  // Add this object to window.EXTERNAL_VERSE_PLAYGROUND in verse_playground/registry.js
{
  enabled: true,
  manifest: {
    id: "ghost_writer",
    title: "Ghost Writer",
    description: "Teach the ghost your handwriting, then watch it write the verse.",
    icon: "👻",
    cardColor: "#252733",
    cardTextColor: "#ffffff",
    launchUrl: "./verse_playground/ghost_writer/index.html",
    visibleInCarousel: true,
    progressType: "practice",
    modes: ["beginner", "advanced"]
  }
},
  {
  enabled: true,
  manifest: {
    id: "verse_clap",
    title: "Verse Clap",
    description: "Listen to the verse, then clap once to pop, scare, and wake each word.",
    icon: "👏",
    cardColor: "#ff66a3",
    cardTextColor: "#ffffff",
    launchUrl: "./verse_playground/verse_clap/index.html",
    visibleInCarousel: false,
    progressType: "practice"
  }
},
  {
  enabled: true,
  manifest: {
    id: "verse_typer",
    title: "Verse Typer",
    description: "Type each verse word as a caterpillar wiggles across the screen.",
    icon: "🐛",
    cardColor: "#7ebf4f",
    cardTextColor: "#ffffff",
    launchUrl: "./verse_playground/verse_typer/index.html",
    visibleInCarousel: true,
    progressType: "practice",
    modes: ["beginner", "advanced"]
  }
},
  {
  enabled: true,
  manifest: {
    id: "wheel_of_bible",
    title: "Wheel of Bible",
    description: "Spin for money, choose letters, and complete missing words from the verse.",
    icon: "🎡",
    cardColor: "#ffc751",
    cardTextColor: "#333333",
    launchUrl: "./verse_playground/wheel_of_bible/index.html",
    visibleInCarousel: false,
    progressType: "practice"
  }
}

];
