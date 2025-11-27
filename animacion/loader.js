// Inicializar animation
let loaderAnimation = null;

// Crear el contenedor global del loader
const loaderOverlay = document.createElement("div");
loaderOverlay.classList.add("loader-overlay");
loaderOverlay.style.display = "none";
document.body.appendChild(loaderOverlay);

// Div donde vivirá la animación
const loaderDiv = document.createElement("div");
loaderDiv.id = "loader-animation";
loaderOverlay.appendChild(loaderDiv);

// Cargar Lottie Web
const script = document.createElement("script");
script.src = "https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.7.4/lottie.min.js";
script.onload = () => {
  loaderAnimation = lottie.loadAnimation({
    container: loaderDiv,
    renderer: "svg",
    loop: true,
    autoplay: false,
    path: "/animacion/loading.json", // tu archivo
  });
};
document.head.appendChild(script);

// Funciones reutilizables
function mostrarLoader() {
  loaderOverlay.style.display = "flex";
  loaderAnimation?.play();
}

function ocultarLoader() {
  loaderAnimation?.stop();
  loaderOverlay.style.display = "none";
}
