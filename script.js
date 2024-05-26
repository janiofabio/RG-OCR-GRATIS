document.addEventListener('DOMContentLoaded', () => {
    alert("DOM completamente carregado");

    const msg = document.querySelector(".message");
    const fileInput = document.querySelector(".file");
    const captureBtn = document.querySelector(".capture-btn");
    const snapBtn = document.querySelector(".snap-btn");
    const video = document.querySelector("#video");
    const canvas = document.querySelector("#canvas");
    const capturedImage = document.querySelector(".captured-image");
    const btn = document.querySelector(".btn");
    const progressBarFill = document.querySelector(".progress-bar-fill");
    const progressInfo = document.querySelector(".progress-info");

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    let imageBase64 = '';

    const isMobile = window.matchMedia("only screen and (max-width: 767px)").matches;

    if (isMobile) {
        captureBtn.style.display = 'inline-block';
        alert("Modo mobile detectado, botão de captura exibido");
    } else {
        captureBtn.style.display = 'none';
        alert("Modo desktop detectado, botão de captura oculto");
    }

    captureBtn.addEventListener('click', async () => {
        alert("Botão de captura clicado");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: "environment" },
                    advanced: [{ focusMode: "continuous" }] // Tenta habilitar o foco contínuo
                }
            });
            video.style.display = 'block';
            snapBtn.style.display = 'block';
            video.srcObject = stream;
            alert("Câmera traseira ativada com foco contínuo");
        } catch (err) {
            console.error("Erro ao acessar a câmera traseira:", err);
            alert("Erro ao acessar a câmera traseira: " + err.message);
        }
    });

    snapBtn.addEventListener('click', () => {
        alert("Botão de tirar foto clicado");
        const context = canvas.getContext('2d');
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;

        const maxCanvasWidth = window.innerWidth * 0.8; // 80% da largura da janela
        const aspectRatio = videoWidth / videoHeight;
        let canvasWidth = maxCanvasWidth;
        let canvasHeight = maxCanvasWidth / aspectRatio;

        if (canvasHeight > window.innerHeight) {
            canvasHeight = window.innerHeight * 0.8; // 80% da altura da janela
            canvasWidth = canvasHeight * aspectRatio;
        }

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        context.drawImage(video, 0, 0, videoWidth, videoHeight, 0, 0, canvasWidth, canvasHeight);
        video.style.display = 'none';
        snapBtn.style.display = 'none';
        capturedImage.style.display = 'block';
        capturedImage.src = canvas.toDataURL('image/jpeg');
        imageBase64 = capturedImage.src.split(',')[1];

        // Pré-processamento com OpenCV.js
        cv['onRuntimeInitialized'] = () => {
            const src = cv.imread(capturedImage);
            const dst = new cv.Mat();
            cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
            cv.threshold(src, src, 120, 200, cv.THRESH_BINARY);
            cv.imshow('canvasOutput', src);
            processedBase64 = canvas.toDataURL('image/jpeg').split(',')[1];
            processOCR(processedBase64);
        };

        canvas.style.display = 'none';
        alert("Foto capturada e exibida");
        fileInput.value = ''; // Limpa o arquivo selecionado anteriormente
    });

    btn.addEventListener('click', () => {
        alert("Botão de gerar OCR clicado");
        const file = fileInput.files ? fileInput.files[0] : null;
        if (!file && !imageBase64) {
            alert("Selecione um arquivo PDF ou capture uma imagem primeiro.");
            return;
        }

        if (file && file.size > MAX_FILE_SIZE) {
            alert("O arquivo é muito grande. O tamanho máximo é de 5MB.");
            return;
        }

        msg.innerHTML = `Carregando...`;
