import { createSignal, onCleanup, onMount } from "solid-js";
import { useNavigate, useSearchParams } from "@solidjs/router";
import styles from "../../App.module.css";
import sfxCamera from "../../assets/sfx/sfxcamera.mp3";
import sfxButton from "../../assets/sfx/sfxbtn.wav";
import sfxCountdown from "../../assets/sfx/sfxcountdown.wav";
import QRComponent from "../helper/QRComponent";

import btnBackIdle from "../../assets/img/btnBackIdle.webp";
import btnBackActive from "../../assets/img/btnBackActive.webp";

import titleCamera from "../../assets/img/photoLabel.png";

import buttonBase from "../../assets/img/btnMainIdle.webp";
import buttonBaseClicked from "../../assets/img/btnMainActive.webp";
import { CircleChevronLeft } from "lucide-solid";
// import wsContext from "../../utils/wsContext";

export default function TakePhotoAI() {
  // photoUrl dan photoPreview sekarang akan menyimpan Blob URL (mis. blob:http://localhost:3000/...)
  const [photoUrl, setPhotoUrl] = createSignal(null);
  const [isCaptured, setIsCaptured] = createSignal(false);
  const [countdown, setCountdown] = createSignal(null);
  const [isCounting, setIsCounting] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(false);
  const [photoPreview, setPhotoPreview] = createSignal(null);
  const [qrUrl, setQrUrl] = createSignal(null);
  const [isPrinting, setIsPrinting] = createSignal(false);
  const [gender, setGender] = createSignal(1);
  const [showQrPopup, setShowQrPopup] = createSignal(false);
  const [params] = useSearchParams();

  const [isActive, setIsActive] = createSignal(false);

  const genderId = params.gender;
  const modelId = params.modelId;

  onMount(() => {
    console.log(genderId);
    console.log(modelId);
  });

  const openQrPopup = () => setShowQrPopup(true);
  const closeQrPopup = () => setShowQrPopup(false);

  const navigate = useNavigate();
  const cameraSound = new Audio(sfxCamera);
  const countdownSound = new Audio(sfxCountdown);
  const buttonSound = new Audio(sfxButton);

  // Header untuk melewati peringatan browser ngrok
  const NGROK_HEADERS = {
    "ngrok-skip-browser-warning": "true",
  };

  /**
   * Mengambil gambar dari URL dengan header ngrok bypass dan mengembalikan Blob URL.
   * Ini digunakan untuk menampilkan gambar yang diambil atau hasil proses.
   * @param {string} url - URL gambar ngrok.
   * @returns {Promise<string|null>} Blob URL atau null jika gagal.
   */
  const fetchImageAsBlobUrl = async (url) => {
    try {
      const response = await fetch(url, { headers: NGROK_HEADERS });
      if (!response.ok) {
        // Jika respons tidak OK, coba log lebih detail
        const errorText = await response.text();
        console.error(
          `HTTP error! Status: ${response.status}, Body: ${errorText}`
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error fetching image as Blob:", error);
      return null;
    }
  };

  // Membersihkan Blob URLs saat komponen tidak lagi digunakan
  onCleanup(() => {
    if (photoUrl()) URL.revokeObjectURL(photoUrl());
    if (photoPreview()) URL.revokeObjectURL(photoPreview());
  });

  const handleCapture = async () => {
    setIsActive(true);
    // wsContext.sendMessage("capture");

    setTimeout(() => {
      setIsActive(false);
    }, 300);

    setIsCounting(true);
    for (let i = 3; i > 0; i--) {
      setCountdown(i);

      const sound = countdownSound.cloneNode();
      sound.play();

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setCountdown(null);
    cameraSound.play();

    try {
      // Trigger pengambilan foto di backend
      await fetch("http://localhost:8000/takephoto-portrait", {
        headers: NGROK_HEADERS,
      });

      // Ambil path ke foto preview dari backend
      const res = await fetch("http://localhost:8000/getpreviewpath", {
        headers: NGROK_HEADERS,
      });
      const data = await res.json();
      console.log("Data:", data);

      if (data?.photo) {
        const ngrokPhotoPath = `http://localhost:8000/${data.photo}`;
        // Ambil foto sebagai blob untuk melewati interstitial ngrok saat menampilkan gambar
        const blobUrl = await fetchImageAsBlobUrl(ngrokPhotoPath);
        if (blobUrl) {
          setPhotoUrl(blobUrl);
          setIsCaptured(true);
        } else {
          // Menggunakan alert kustom sebagai pengganti window.alert
          // Anda perlu mengimplementasikan komponen modal kustom untuk ini
          console.error("Gagal memuat foto preview.");
          // alert("Gagal memuat foto preview."); // Ganti dengan modal kustom
        }
      } else {
        console.error("Gagal mendapatkan foto.");
        // alert("Gagal mendapatkan foto."); // Ganti dengan modal kustom
      }
    } catch (err) {
      console.error("Error taking photo:", err);
      // alert("Terjadi kesalahan saat mengambil foto."); // Ganti dengan modal kustom
    } finally {
      setIsCounting(false);
    }
  };

  const handleRetake = () => {
    buttonSound.play();
    if (photoUrl()) URL.revokeObjectURL(photoUrl()); // Bersihkan Blob URL lama
    setPhotoUrl(null);
    setIsCaptured(false);
  };

  const handleConfirm = async () => {
    buttonSound.play();
    setIsLoading(true);

    try {
      await fetch("http://localhost:8000/confirmphoto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...NGROK_HEADERS,
        },
        body: JSON.stringify({ option: 2 }),
      });
      await fetch("http://localhost:8000/swapface", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...NGROK_HEADERS,
        },
        body: JSON.stringify({ option: modelId, gender: genderId }),
      });
      // await fetch("http://localhost:8000/framing", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //     ...NGROK_HEADERS,
      //   },
      //   body: JSON.stringify({ option: 3 }),
      // });
      await fetch("http://localhost:8000/uploadconfirmphoto", {
        headers: NGROK_HEADERS,
      });

      // Ambil hasil foto dan QR code secara paralel
      const [photoResponse, qrResponse] = await Promise.all([
        fetch("http://localhost:8000/getresultpath", {
          headers: NGROK_HEADERS,
        }),
        fetch("http://localhost:8000/getqrurl", {
          headers: NGROK_HEADERS,
        }),
      ]);

      const photoData = await photoResponse.json();
      const qrData = await qrResponse.json();

      if (photoData?.photo) {
        const ngrokResultPhotoPath = `http://localhost:8000/${photoData.photo}`;
        // Ambil foto hasil sebagai blob untuk melewati interstitial ngrok saat menampilkan gambar
        const blobUrl = await fetchImageAsBlobUrl(ngrokResultPhotoPath);
        if (blobUrl) {
          setPhotoPreview(blobUrl);
        } else {
          console.error("Foto hasil belum tersedia.");
          // alert("Hasil foto belum tersedia. Mohon tunggu sebentar."); // Ganti dengan modal kustom
          return;
        }
      } else {
        console.error("Foto hasil belum tersedia.");
        // alert("Hasil foto belum tersedia. Mohon tunggu sebentar."); // Ganti dengan modal kustom
        return;
      }

      if (qrData?.download_url) {
        setQrUrl(qrData.download_url);
      } else {
        console.error("QR URL tidak ditemukan.");
      }
    } catch (err) {
      console.error("Gagal dalam salah satu proses:", err);
      // alert("Terjadi kesalahan saat konfirmasi."); // Ganti dengan modal kustom
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = async () => {
    setIsPrinting(true);

    try {
      const printResponse = await fetch(
        "http://localhost:8000/printphoto-portrait",
        {
          method: "GET",
          headers: NGROK_HEADERS,
        }
      );

      if (!printResponse.ok) {
        console.error("Failed to print the photo.");
        // alert("Gagal mencetak foto."); // Ganti dengan modal kustom
      }

      buttonSound.play();

      setTimeout(() => {
        setIsPrinting(false);
      }, 15000);
    } catch (err) {
      console.error("Error printing photo:", err);
      // alert("Terjadi kesalahan saat mencetak foto."); // Ganti dengan modal kustom
      setIsPrinting(false);
    }
  };

  const takeNewPhoto = () => {
    buttonSound.play();
    // wsContext.sendMessage("back");

    if (photoPreview()) URL.revokeObjectURL(photoPreview()); // Bersihkan Blob URL lama
    setPhotoPreview(null);
    setIsCaptured(false);
    if (photoUrl()) URL.revokeObjectURL(photoUrl()); // Bersihkan Blob URL lama
    setPhotoUrl(null);

    navigate("/");
  };

  return (
    <div class="w-full flex flex-col items-center justify-center">
      <p
        class="absolute top-40 text-[75px] px-20 text-center tracking-widest leading-20 text-white"
        style={{ "font-family": "GeelyBold" }}
      >
        <Show when={!countdown()}>
          <span class="uppercase">
            {isCaptured() ? "DO YOU WANT TO USE THIS PHOTO?" : "GET READY"}
          </span>
        </Show>
      </p>
      <div
        class={`flex flex-col h-screen w-full justify-center items-center gap-10 shadow-none px-5 ${styles.fadeIn}`}
        style={{ "font-family": "InterSemiBold" }}
      >
        {/* <img
          src={logoJudul}
          alt="Logo"
          class="w-[300px] mt-40 mb-10 opacity-100"
        /> */}
        <div class="w-[550px] h-auto flex items-center justify-center">
          {!isCaptured() ? (
            <div class="flex justify-center items-center">
              <img
                id="camera-stream"
                // PENTING: Untuk live camera stream ini, kamu HARUS membuat proxy di backend kamu.
                // Ganti URL ini dengan endpoint proxy di backend kamu.
                // Contoh: src="http://localhost:5000/api/stream-portrait"
                // Backend kamu akan mengambil stream dari ngrok dengan header bypass
                // dan meneruskannya ke frontend.
                src="http://localhost:8000/stream-portrait" // <-- GANTI INI DENGAN URL PROXY BACKEND KAMU
                alt="Camera Preview"
                class="w-[550px] h-full object-cover rounded-[40px] border-2 border-white"
              />
              <Show when={!countdown()}>
                <img class="absolute" src={titleCamera} alt="Camera Title" />
              </Show>
            </div>
          ) : (
            <img
              src={photoPreview() || photoUrl()} // photoUrl dan photoPreview sekarang adalah Blob URLs
              alt="Captured"
              class={`w-[550px] h-auto object-cover rounded-[44px] border-2 border-white ${
                isLoading() ? "blur-sm" : ""
              }`}
            />
          )}

          {countdown() && (
            <div class="absolute text-white text-[250px] font-bold z-10 mt-40 top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-lg">
              {countdown()}
            </div>
          )}
          {isLoading() && (
            <div class="absolute top-1/3 mt-40 flex flex-col items-center justify-center w-full gap-2 text-white">
              <span class="loader absolute"></span>
              <span class="animate-pulse">Loading...</span>
            </div>
          )}
        </div>

        {isPrinting() && (
          <div class="absolute w-screen min-h-screen z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div class="text-white text-center space-y-4">
              <div class="w-20 h-20 border-4 border-white border-dashed rounded-lg animate-spin mx-auto"></div>
              <p class="text-[40px] animate-bounce">Print Photo</p>
              <p class="text-[40px] animate-bounce">Please wait...</p>
            </div>
          </div>
        )}
        <div class="flex items-center justify-center w-full gap-4 mt-5">
          {!isCaptured() ? (
            <div class="flex flex-row justify-center items-center gap-12 w-full">
              {/* 🔴 Menu Utama */}
              {/* <button
                onMouseDown={() => setIsActive(true)}
                onMouseUp={() => setTimeout(() => setIsActive(false), 300)}
                onMouseLeave={() => setIsActive(false)}
                onClick={() => {
                  setIsActive(true);
                  buttonSound.play();
                  setTimeout(() => {
                    navigate("/");
                  }, 500);
                }}
                disabled={isCounting()}
                class={`flex w-40 h-40 font-bold transition-all duration-300 active:scale-95 uppercase tracking-widest rounded-[25px]
      ${isCounting() ? "opacity-50 cursor-not-allowed" : ""}`}
                style={{
                  "background-image": `url(${
                    !isActive() ? btnBackIdle : btnBackActive
                  })`,
                  "background-size": "cover",
                  "background-position": "center",
                  "background-repeat": "no-repeat",
                }}
              >
              </button> */}

              <button
                onClick={() => {
                  navigate("/");
                  buttonSound.play();
                }}
                disabled={isCounting()}
                class={`btn-geely-square ${
                  isCounting() ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <CircleChevronLeft size={80} strokeWidth={3} />
              </button>

              {/* 🟢 Tombol Ambil Foto */}
              <button
                onClick={handleCapture}
                disabled={isCounting()}
                class={`btn-geely ${
                  isCounting() ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Take Photo
              </button>
            </div>
          ) : photoPreview() ? (
            <div class="flex flex-col gap-4 w-full">
              {/* QR Button Section */}
              {/* <button
                class="bg-[#212c4a] text-white text-[40px] px-3 py-2 rounded-lg shadow-md transition-all duration-500 active:scale-75 uppercase"
                onClick={openQrPopup}
              >
                Show QR
              </button> */}
              <div className="flex gap-6 items-stretch h-64">
                {/* Kotak QR */}
                <div className="flex-1 flex items-center justify-center bg-white rounded-2xl border-2 border-gray-300 shadow-sm overflow-hidden">
                  <QRComponent
                    className="w-full h-full object-contain rounded-2xl"
                    urlQr={qrUrl()}
                  />
                </div>

                {/* Kotak Teks */}
                <div className="flex-1 flex items-center justify-center">
                  <p className="h-full w-full text-[50px] font-semibold leading-tight tracking-wide text-black text-center bg-white rounded-2xl border-2 border-gray-300 shadow-sm p-6 flex items-center justify-center">
                    SCAN QR CODE
                    <br />
                    TO DOWNLOAD
                  </p>
                </div>
              </div>

              <div class="flex gap-4 w-full">
                <button
                  onClick={takeNewPhoto}
                  class="btn-geely w-full px-16 py-6 text-[35px]"
                >
                  Take New Photo
                </button>

                <button
                  onClick={handlePrint}
                  hidden
                  class="btn-geely w-full px-16 py-6 text-[35px]"
                >
                  Print
                </button>
              </div>
            </div>
          ) : (
            <div class="flex flex-col items-center gap-4 w-full">
              {/* <div class="flex gap-4">
                <button
                  class={`px-6 py-2 rounded-lg border-2 font-bold transition ${
                    gender() === 1
                      ? "bg-blue-500 text-white border-blue-500"
                      : "text-blue-500 border-blue-500 hover:bg-blue-500 hover:text-white"
                  }`}
                  onClick={() => setGender(1)}
                >
                  Male
                </button>

                <button
                  class={`px-6 py-2 rounded-lg border-2 font-bold transition ${
                    gender() === 2
                      ? "bg-pink-500 text-white border-pink-500"
                      : "text-pink-500 border-pink-500 hover:bg-pink-500 hover:text-white"
                  }`}
                  onClick={() => setGender(2)}
                >
                  Female
                </button>
              </div> */}
              <div class="flex gap-4 w-full justify-center">
                <button
                  onClick={handleRetake}
                  class="btn-geely flex-1 max-w-[250px] px-10 py-3 text-[35px]"
                >
                  Retake Photo
                </button>

                <button
                  onClick={handleConfirm}
                  class="btn-geely flex-1 max-w-[250px] px-10 py-3 text-[35px]"
                >
                  Generate
                </button>
              </div>
            </div>
          )}
        </div>
        {/* QR Pop-up */}
        {showQrPopup() && (
          <div class="fixed inset-0 z-50 flex flex-col items-center justify-center">
            <div class="bg-white rounded-lg p-8 shadow-lg flex flex-col items-center">
              <QRComponent urlQr={qrUrl()} />
              <p class="text-[40px] mt-4 font-bold text-center">
                Scan Here to Download
              </p>
              <button
                onClick={closeQrPopup}
                class="mt-6 bg-[#212c4a] text-white px-3 py-2 rounded-lg uppercase shadow-md transition-all duration-500 active:scale-75"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
