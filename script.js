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

    // Pré-processamento básico da imagem
    const image = new Image();
    image.onload = () => {
        const canvasTemp = document.createElement('canvas');
        const contextTemp = canvasTemp.getContext('2d');

        canvasTemp.width = image.width;
        canvasTemp.height = image.height;
        contextTemp.drawImage(image, 0, 0, image.width, image.height);

        // Aplicar pré-processamento (aqui você pode tentar ajustar os parâmetros)
        // Por exemplo: aumentar o contraste
        const imageData = contextTemp.getImageData(0, 0, image.width, image.height);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
            imageData.data[i] = avg; // R
            imageData.data[i + 1] = avg; // G
            imageData.data[i + 2] = avg; // B
        }
        contextTemp.putImageData(imageData, 0, 0);

        // Converter imagem para base64 após pré-processamento
        const processedImageBase64 = canvasTemp.toDataURL('image/jpeg').split(',')[1];

        // Chamar a função de OCR com a imagem pré-processada
        processOCR(processedImageBase64);
    };
    image.src = capturedImage.src;
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
        progressBarFill.style.width = '0%';
        progressInfo.innerHTML = '';
        alert("Iniciando processamento OCR");

        if (file) {
            let fr = new FileReader();
            fr.readAsDataURL(file);
            fr.onload = () => {
                let res = fr.result;
                let b64 = res.split("base64,")[1];
                alert("Arquivo lido, iniciando OCR");
                processOCR(b64);
            };
        } else if (imageBase64) {
            alert("Imagem capturada, iniciando OCR");
            processOCR(imageBase64);
        }
    });

    function processOCR(base64Data) {
        alert("Processando OCR");
        Tesseract.recognize(
            `data:image/jpeg;base64,${base64Data}`,
            'por', // Use the Portuguese language trained data
            {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        let percentComplete = Math.round(m.progress * 100);
                        progressBarFill.style.width = `${percentComplete}%`;
                        progressInfo.innerHTML = `Carregando: ${percentComplete}%`;
                    }
                }
            }
        ).then(({ data: { text } }) => {
            progressBarFill.style.width = '100%';
            msg.innerHTML = '';
            alert("OCR concluído, exibindo resultado");
            openTextInNewWindow(text);
        }).catch(error => {
            msg.innerHTML = `Erro ao processar o arquivo.`;
            alert("Erro ao processar o arquivo: " + error.message);
            console.error('Error:', error);
        });
    }

    function openTextInNewWindow(text) {
        alert("Abrindo resultado do OCR em nova janela");
        let newWindow = window.open("", "_blank");
        newWindow.document.write("<html><head><title>OCR Resultado</title></head><body>");
        newWindow.document.write("<pre>" + text + "</pre>");
        newWindow.document.write("</body></html>");
        newWindow.document.close();
    }
});
