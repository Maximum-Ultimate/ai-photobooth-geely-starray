import { createSignal, onMount } from "solid-js";
import logo from "../assets/img/asusLogo.webp";
import styles from "../App.module.css";

function Loading(background) {
  const [isVisible, setIsVisible] = createSignal(false);

  onMount(() => {
    setTimeout(() => {
      setIsVisible(true);
    }, 100);
  });

  return (
    <div
      class="min-h-screen w-full flex flex-col items-center justify-center relative text-[#000511]"
      style={{ "font-family": "AsusFontTitle" }}
    >
      <div class={`flex flex-col items-center ${styles.fadeIn}`}>
        <img
          src={logo}
          alt="Logo"
          class="w-40 sm:w-56 md:w-72 lg:w-80 xl:w-96 mb-12 rounded-lg object-contain"
        />
        <p
          class="text-[65px] text-[#FFB848] text-center tracking-widest leading-20 uppercase"
          style={{ "font-family": "AsusFontTitle" }}
        >
          {/* Loading... */}
        </p>
      </div>
    </div>
  );
}

export default Loading;
