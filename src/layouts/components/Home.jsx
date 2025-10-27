import { createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import styles from "../../App.module.css";
import buttonBase from "../../assets/img/btnHomeIdle.webp";
import buttonBaseClicked from "../../assets/img/btnHomeActive.webp";
import sfxButton from "../../assets/sfx/sfxbtn.wav";
import backgroundIn from "../../assets/videos/bgHomeIn.mp4";
import backgroundLoop from "../../assets/videos/bgHomeLoop.mp4";
import homeTitle from "../../assets/img/homeTitle.webp";
// import wsContext from "../../utils/wsContext";

import geelyLogo from "../../assets/img/geelyLogo.webp";

export default function Home() {
  const [isActive, setIsActive] = createSignal(false);
  const [introDone, setIntroDone] = createSignal(false); // 🔥 track apakah intro kelar
  const navigate = useNavigate();
  const buttonSound = new Audio(sfxButton);

  const takePhotoAI = () => {
    buttonSound.play();
    // wsContext.sendMessage("start");
    setIsActive(true);
    setTimeout(() => setIsActive(false), 300);
    setTimeout(() => navigate("/choose-gender-model"), 1000);
  };

  return (
    <div class="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden">
      {/* 🎥 Video Background */}
      {/* {!introDone() ? (
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
      )} */}
      <video
        src={backgroundLoop}
        autoplay
        muted
        loop
        playsinline
        class="absolute inset-0 w-full h-full object-cover z-0"
      />
      {/* 🔥 Konten utama */}
      <div
        class={`flex flex-col h-screen justify-between items-center px-5 gap-52 py-[250px] ${styles.fadeIn} relative z-10`}
        style={{ "font-family": "InterSemiBold" }}
      >
        <div class="flex flex-col items-center gap-24">
          <img class="" src={geelyLogo} alt="" />
          <img class="" src={homeTitle} alt="" />
        </div>
        <div class="flex flex-col gap-4">
          <button
            onClick={takePhotoAI}
            class="w-full font-bold mb-[250px] px-20 py-[25px] text-[60px] transition-all duration-150 tracking-wide rounded-[25px]
         bg-gradient-to-b from-[#e7ebf0] to-[#8491a3]
         shadow-[4px_4px_8px_#b4b9bf,_-4px_-4px_8px_#f5f8fb]
         text-black
         active:from-[#7188a0] active:to-[#3f4a55] active:shadow-inner active:text-white active:scale-95"
          >
            <span class="text-center">Frame Your Future</span>
          </button>
        </div>
      </div>
    </div>
  );
}
