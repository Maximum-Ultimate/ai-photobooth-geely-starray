import { createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import styles from "../../App.module.css";
import buttonBase from "../../assets/img/btnHomeIdle.webp";
import buttonBaseClicked from "../../assets/img/btnHomeActive.webp";
import sfxButton from "../../assets/sfx/sfxbtn.wav";
import backgroundIn from "../../assets/videos/bgHomeIn.mp4";
import backgroundLoop from "../../assets/videos/bgHomeLoop.mp4";
import homeTitle from "../../assets/img/homeTitle.webp";
import wsContext from "../../utils/wsContext";

export default function Home() {
  const [isActive, setIsActive] = createSignal(false);
  const [introDone, setIntroDone] = createSignal(false); // 🔥 track apakah intro kelar
  const navigate = useNavigate();
  const buttonSound = new Audio(sfxButton);

  const takePhotoAI = () => {
    buttonSound.play();
    wsContext.sendMessage("start");
    setIsActive(true);
    setTimeout(() => setIsActive(false), 300);
    setTimeout(() => navigate("/choose-gender-model"), 1000);
  };

  return (
    <div class="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden">
      {/* 🎥 Video Background */}
      {!introDone() ? (
        <video
          src={backgroundIn}
          autoplay
          muted
          playsinline
          onEnded={() => setIntroDone(true)} // ⬅️ begitu kelar, lanjut ke loop
          class="absolute inset-0 w-full h-full object-cover z-0"
        />
      ) : (
        <video
          src={backgroundLoop}
          autoplay
          muted
          loop
          playsinline
          class="absolute inset-0 w-full h-full object-cover z-0"
        />
      )}

      {/* 🔥 Konten utama */}
      <div
        class={`flex flex-col items-center px-5 gap-40 ${styles.fadeIn} relative z-10`}
        style={{ "font-family": "AsusFontTitle" }}
      >
        <img class="opacity-0" src={homeTitle} alt="" />
        <div class="flex flex-col gap-4 w-full">
          <button
            onMouseDown={() => setIsActive(true)}
            onMouseUp={() => setTimeout(() => setIsActive(false), 150)}
            onMouseLeave={() => setIsActive(false)}
            onClick={takePhotoAI}
            style={{
              "background-image": `url(${
                isActive() ? buttonBaseClicked : buttonBase
              })`,
              "background-size": "cover",
              "background-position": "center",
            }}
            class="w-full font-bold mb-24 px-16 py-[15px] text-[60px] transition-all duration-150 active:scale-95 tracking-wide uppercase"
          >
            <span class="text-white-3d shine">Buat Fotomu Sendiri</span>
          </button>
        </div>
      </div>
    </div>
  );
}
