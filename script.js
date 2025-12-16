document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.querySelector(".theme-toggle");
  const promptForm = document.querySelector(".prompt-form");
  const promptInput = document.querySelector(".prompt-input");
  const promptBtn = document.querySelector(".prompt-btn");
  const modelSelect = document.getElementById("model-select");
  const countSelect = document.getElementById("count-select");
  const ratioSelect = document.getElementById("ratio-select");
  const gridGallery = document.querySelector(".gallery-grid");

  const examplePrompts = [
    "A magic forest with glowing plants and fairy homes among giant mushrooms",
    "An old steampunk airship floating through golden clouds at sunset",
    "A future Mars colony with glass domes and gardens against red mountains",
    "A dragon sleeping on gold coins in a crystal cave",
    "An underwater kingdom with merpeople and glowing coral buildings",
    "A floating island with waterfalls pouring into clouds below",
    "A witch's cottage in fall with magic herbs in the garden",
    "A robot painting in a sunny studio with art supplies around it",
    "A magical library with floating glowing books and spiral staircases",
    "A Japanese shrine during cherry blossom season with lanterns and misty mountains",
    "A cosmic beach with glowing sand and an aurora in the night sky",
    "A medieval marketplace with colorful tents and street performers",
    "A cyberpunk city with neon signs and flying cars at night",
    "A peaceful bamboo forest with a hidden ancient temple",
    "A giant turtle carrying a village on its back in the ocean",
  ];

  if (!themeToggle) return;

  const icon = themeToggle.querySelector("i");
  icon.classList.add("fa-solid");

  // Load theme from localStorage or system
  const savedTheme = localStorage.getItem("theme");
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = savedTheme === "dark" || (!savedTheme && systemDark);
  document.body.classList.toggle("dark-theme", isDark);
  if (isDark) icon.classList.replace("fa-moon", "fa-sun");
  else icon.classList.replace("fa-sun", "fa-moon");

  // Convert aspect ratio string to width & height
  const getImageDimensions = (aspectRatio, baseSize = 512) => {
    const [w, h] = aspectRatio.split("/").map(Number);
    const scaleFactor = baseSize / Math.max(w, h);

    let calculatedWidth = Math.round(w * scaleFactor);
    let calculatedHeight = Math.round(h * scaleFactor);

    calculatedWidth = Math.floor(calculatedWidth / 16) * 16;
    calculatedHeight = Math.floor(calculatedHeight / 16) * 16;

    return { width: calculatedWidth, height: calculatedHeight };
  };

  // Create image card with loading state
  const createImageCards = (imageCount) => {
    gridGallery.innerHTML = "";
    for (let i = 0; i < imageCount; i++) {
      const card = document.createElement("div");
      card.className = "img-card loading";
      card.id = `img-card-${i}`;
      card.innerHTML = `
        <div class="status-container">
          <div class="spinner"></div>
          <p class="status-text">Generating...</p>
        </div>
      `;
      gridGallery.appendChild(card);
    }
  };

  // Update card with generated image
  const updateImageCard = (imgIndex, imgUrl) => {
    const imgCard = document.getElementById(`img-card-${imgIndex}`);
    if (!imgCard) return;
    imgCard.classList.remove("loading");
    imgCard.innerHTML = `
      <img src="${imgUrl}" alt="Generated image" class="result-img" />
      <div class="img-overlay">
        <a href="${imgUrl}" class="img-download-btn" download="image-${Date.now()}.png">
          <i class="fa-solid fa-download"></i>
        </a>
      </div>
    `;
  };

  // Generate images via backend
  const generateImages = async (selectedModel, imageCount, width, height, promptText) => {
    const BACKEND_URL = "http://localhost:3000/generate";

    const imagePromises = Array.from({ length: imageCount }, async (_, i) => {
      try {
        const response = await fetch(BACKEND_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: selectedModel, prompt: promptText, width, height }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err?.error || "Image generation failed");
        }

        const blob = await response.blob();
        const imageURL = URL.createObjectURL(blob);
        updateImageCard(i, imageURL);

      } catch (error) {
        console.error(`Image ${i} failed:`, error.message);
      }
    });

    await Promise.allSettled(imagePromises);
  };

  // Handle form submission
  const handleFormSubmit = (e) => {
    e.preventDefault();
    const imageCount = parseInt(countSelect.value) || 1;
    const selectedModel = modelSelect.value;
    const promptText = promptInput.value.trim();
    const ratio = ratioSelect.value; // "1/1", "16/9", "9/16"
    const { width, height } = getImageDimensions(ratio);

    createImageCards(imageCount);
    generateImages(selectedModel, imageCount, width, height, promptText);
  };

  // Random prompt button
  promptBtn.addEventListener("click", () => {
    const prompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
    promptInput.value = prompt;
    promptInput.focus();
  });

  // Submit form
  promptForm.addEventListener("submit", handleFormSubmit);

  // Theme toggle
  themeToggle.addEventListener("click", (e) => {
    e.preventDefault();
    const dark = document.body.classList.toggle("dark-theme");
    localStorage.setItem("theme", dark ? "dark" : "light");
    if (dark) icon.classList.replace("fa-moon", "fa-sun");
    else icon.classList.replace("fa-sun", "fa-moon");
  });
});
